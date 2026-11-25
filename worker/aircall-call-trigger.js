/**
 * Cloudflare Worker + Durable Object: abandoned checkout -> Aircall AI Voice Agent call.
 *
 * The 30 second abandonment timer runs HERE, not in the shopper's browser, so the
 * call still happens if the shopper closes the tab.
 *
 *   store  --POST {action:"arm"}------>  Worker  -> CheckoutTimer (one per checkout)
 *                                                      sets an alarm at now + delay
 *   store  --POST {action:"arm"}------>  (cart or details changed: alarm moves forward)
 *   store  --POST {action:"complete"}->  order placed: alarm cancelled, no call
 *   alarm fires (tab open or closed) -> POST {AIRCALL_API_BASE}/v1/outbound-calls/agents/{agentId}
 *   store  --GET /status?id=...------->  presenter panel shows armed / sent / error
 *
 * Every checkout that passes the checks is also saved as a lead (name, phone, email, cart,
 * call outcome) in a single Durable Object named "leads". Download them as CSV from
 * GET /leads.csv (HTTP Basic auth, any user name, password = LEADS_ADMIN_KEY) and erase
 * them with DELETE /leads (same auth).
 *
 * Deploy with wrangler (see wrangler.toml). Secrets, set with `wrangler secret put NAME`:
 *   AIRCALL_API_ID, AIRCALL_API_TOKEN   Aircall API credentials
 *   AGENT_ID                            outbound agent ID (or AGENT_ID_EN / AGENT_ID_FR per language)
 *   ALLOWED_NUMBERS                     comma list of E.164 numbers allowed to be called, and/or
 *   ALLOWED_PHONE_PREFIXES              comma list of prefixes, e.g. "+33,+44". At least one is required.
 *   DEMO_PASSCODE                       requests that can place calls must carry it. Required when
 *                                       ALLOWED_PHONE_PREFIXES is set (open dialing on a public site).
 *   LEADS_ADMIN_KEY                     password for GET /leads.csv and DELETE /leads
 *   DRY_RUN                             "true" = build the Aircall request but never call
 * Plain vars (wrangler.toml): ALLOWED_ORIGINS, ABANDON_DELAY_SECONDS, AIRCALL_API_BASE,
 *   EXPIRATION_SECONDS, MAX_CALLS_PER_NUMBER_PER_HOUR, MAX_CALLS_PER_HOUR (all numbers together)
 */

const CONTEXT_KEYS = [
  "contact_first_name",
  "contact_last_name",
  "contact_email",
  "contact_phone",
  "language",
  "store_name",
  "cart_reference",
  "cart_items",
  "cart_item_count",
  "cart_total",
  "shipping_note",
  "discount_code",
  "discount_offer"
];
const CLEANUP_AFTER_MS = 24 * 3600 * 1000; // forget a checkout a day after it is settled

/* ======================================================================= Worker */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (request.method === "GET" && url.pathname.replace(/\/+$/, "") === "/status") {
      const id = cleanId(url.searchParams.get("id"));
      if (!id) return json({ ok: false, error: "missing_id" }, 400, cors);
      return relay(await timer(env, "checkout:" + id).fetch("https://timer/status"), cors);
    }
    const path = url.pathname.replace(/\/+$/, "");
    if (path === "/leads.csv" || path === "/leads") {
      if (!env.LEADS_ADMIN_KEY) return json({ ok: false, error: "leads_export_disabled", message: "Set the LEADS_ADMIN_KEY secret" }, 404);
      if (!adminAuthorized(request, env)) {
        return new Response("Admin key required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Leads", charset="UTF-8"' } });
      }
      const store = timer(env, "leads");
      if (request.method === "DELETE") return relay(await store.fetch("https://timer/lead/clear", { method: "POST" }), {});
      if (request.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
      const rows = await (await store.fetch("https://timer/lead/list")).json();
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      return new Response(leadsCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="leads-' + stamp + '.csv"',
          "Cache-Control": "no-store"
        }
      });
    }
    if (request.method === "GET") {
      return json({ ok: true, service: "cart-recovery-call", dry_run: isTrue(env.DRY_RUN), server_timer: true }, 200, cors);
    }
    if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, cors);

    if (!originAllowed(origin, env)) {
      return json({ ok: false, error: "origin_not_allowed", message: "Add this site to ALLOWED_ORIGINS" }, 403, cors);
    }

    let body;
    try {
      const raw = await request.text();
      if (raw.length > 8000) return json({ ok: false, error: "payload_too_large" }, 413, cors);
      body = JSON.parse(raw);
    } catch (e) {
      return json({ ok: false, error: "invalid_json" }, 400, cors);
    }

    const action = body.action || "call_now";
    const attempt = cleanId(body.attempt_id);
    if (!attempt) return json({ ok: false, error: "missing_attempt_id" }, 400, cors);
    const checkout = timer(env, "checkout:" + attempt);

    // Settling a checkout can never place a call, so it needs no passcode or allowlist.
    if (action === "complete" || action === "cancel") {
      return relay(await checkout.fetch("https://timer/" + action, { method: "POST" }), cors);
    }
    if (action !== "arm" && action !== "call_now") {
      return json({ ok: false, error: "unknown_action" }, 400, cors);
    }

    // Calling any number of a country from a public page is only safe behind a passcode.
    if (list(env.ALLOWED_PHONE_PREFIXES).length && !env.DEMO_PASSCODE) {
      return json({ ok: false, error: "passcode_required", message: "ALLOWED_PHONE_PREFIXES is set, so the Worker also needs a DEMO_PASSCODE secret" }, 500, cors);
    }
    if (env.DEMO_PASSCODE && String(body.passcode || "") !== String(env.DEMO_PASSCODE)) {
      return json({ ok: false, error: "invalid_passcode", message: "Wrong or missing demo passcode" }, 401, cors);
    }

    const phone = normalizePhone(body.phone);
    if (!phone) return json({ ok: false, error: "invalid_phone", message: "Phone must be E.164, e.g. +33612345678" }, 400, cors);

    const allow = phoneAllowed(phone, env);
    if (!allow.ok) return json({ ok: false, error: "phone_not_allowed", message: allow.message }, 403, cors);

    const lang = body.lang === "fr" ? "fr" : "en";
    const dryRun = isTrue(env.DRY_RUN);
    const agentId = (lang === "fr" ? env.AGENT_ID_FR : env.AGENT_ID_EN) || env.AGENT_ID ||
      (dryRun ? "AGENT_ID_NOT_SET" : "");
    if (!agentId) {
      return json({ ok: false, error: "agent_not_configured", message: "Set the AGENT_ID secret (or AGENT_ID_EN / AGENT_ID_FR)" }, 500, cors);
    }

    const firstName = cleanText(body.first_name, 60);
    const lastName = cleanText(body.last_name, 60);
    const base = String(env.AIRCALL_API_BASE || "https://api.aircall.io").replace(/\/+$/, "");
    const job = {
      attempt: attempt,
      baseKey: "cart-recovery-" + attempt,
      url: base + "/v1/outbound-calls/agents/" + encodeURIComponent(agentId),
      request: {
        contact_phone: phone,
        contact_name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
        idempotency_key: "cart-recovery-" + attempt,
        context: Object.assign(cleanContext(body.context, lang), {
          contact_email: cleanText(body.email, 120),
          contact_phone: phone // the number the visitor typed, checked above
        }),
        expiration_seconds: clampInt(env.EXPIRATION_SECONDS, 60, 86400, 300)
      }
    };
    const defaultDelay = clampInt(env.ABANDON_DELAY_SECONDS, 5, 3600, 30);
    const delayMs = clampInt(body.delay_seconds, 5, 3600, defaultDelay) * 1000;

    // Save the visitor as a lead. A storage problem must never stop the call.
    try {
      await timer(env, "leads").fetch("https://timer/lead/upsert", {
        method: "POST",
        body: JSON.stringify({
          attempt: attempt,
          status: action === "call_now" ? "calling" : "armed",
          lead: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: cleanText(body.email, 120),
            language: lang,
            cart_items: job.request.context.cart_items,
            cart_total: job.request.context.cart_total,
            follow_up_ok: !!body.follow_up
          }
        })
      });
    } catch (e) {
      console.log("lead save failed", String(e));
    }

    return relay(await checkout.fetch("https://timer/" + action, {
      method: "POST",
      body: JSON.stringify({ job, delayMs })
    }), cors);
  }
};

/* ============================================================ Durable Object */

/**
 * One instance per checkout (named "checkout:<attempt id>") holds the cart snapshot
 * and the alarm. Instances named "limit:<phone>" are used as a per-number rate limiter.
 */
export class CheckoutTimer {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.storage = ctx.storage;
    this.env = env;
  }

  async fetch(request) {
    const path = new URL(request.url).pathname;
    const input = request.method === "POST" ? await request.json().catch(() => ({})) : {};

    if (path === "/limit") return json(await this.takeRateLimitSlot(input.max));
    if (path.startsWith("/lead/")) return json(await this.leads(path, input));

    const rec = (await this.storage.get("rec")) || { status: "idle", calls: 0 };

    if (path === "/status") return json(view(rec));

    if (path === "/arm") {
      // One automatic call per checkout: once it is calling, called or bought, arming does nothing.
      if (["calling", "sent", "converted"].includes(rec.status)) return json(view(rec));
      const now = Date.now();
      const next = { status: "armed", job: input.job, deadline: now + input.delayMs, calls: rec.calls || 0 };
      await this.storage.put("rec", next);
      await this.storage.setAlarm(next.deadline);
      return json(view(next));
    }

    if (path === "/call_now") {
      if (rec.status === "calling") return json(view(rec));
      const next = { status: "calling", job: input.job, calls: (rec.calls || 0) + 1, deadline: null };
      await this.storage.put("rec", next);
      return json(view(await this.place(next)));
    }

    if (path === "/complete") {
      const next = rec.status === "sent" || rec.status === "calling"
        ? Object.assign({}, rec, { purchased: true })
        : Object.assign({}, rec, { status: "converted", deadline: null });
      return json(view(await this.settle(next)));
    }

    if (path === "/cancel") {
      const next = ["armed", "error", "idle"].includes(rec.status)
        ? Object.assign({}, rec, { status: "cancelled", deadline: null })
        : rec;
      return json(view(await this.settle(next)));
    }

    return json({ ok: false, error: "not_found" }, 404);
  }

  async alarm() {
    const rec = await this.storage.get("rec");
    if (!rec) return;
    if (rec.status === "armed") {
      if (Date.now() < rec.deadline - 500) { // re-armed while this alarm was in flight
        await this.storage.setAlarm(rec.deadline);
        return;
      }
      const next = Object.assign({}, rec, { status: "calling", calls: (rec.calls || 0) + 1 });
      await this.storage.put("rec", next);
      await this.place(next);
      return;
    }
    if (rec.cleanupAt && Date.now() >= rec.cleanupAt) await this.storage.deleteAll();
  }

  async place(rec) {
    // Every attempt after the first gets its own key, or Aircall would treat it as a duplicate.
    const baseKey = rec.job.baseKey;
    rec.job.request.idempotency_key = rec.calls > 1 ? baseKey + "-" + rec.calls : baseKey;
    let result;
    if (!isTrue(this.env.DRY_RUN)) {
      const perNumber = clampInt(this.env.MAX_CALLS_PER_NUMBER_PER_HOUR, 1, 1000, 6);
      const total = clampInt(this.env.MAX_CALLS_PER_HOUR, 1, 10000, 60);
      if (!(await takeSlot(this.env, "limit:" + rec.job.request.contact_phone, perNumber))) {
        result = { ok: false, error: "rate_limited", message: "Too many calls to this number in the last hour" };
      } else if (!(await takeSlot(this.env, "limit:all-numbers", total))) {
        result = { ok: false, error: "rate_limited", message: "Hourly call limit reached (MAX_CALLS_PER_HOUR)" };
      }
    }
    if (!result) result = await callAircall(this.env, rec.job);
    const next = Object.assign({}, rec, { status: result.ok ? "sent" : "error", result, deadline: null });
    return this.settle(next);
  }

  // Store a settled record, schedule its cleanup and report the outcome on the lead.
  async settle(rec) {
    if (rec.status === "armed") { await this.storage.put("rec", rec); return rec; }
    rec.cleanupAt = Date.now() + CLEANUP_AFTER_MS;
    await this.storage.put("rec", rec);
    await this.storage.setAlarm(rec.cleanupAt);
    if (rec.job && rec.job.attempt) {
      const r = rec.result || {};
      try {
        await timer(this.env, "leads").fetch("https://timer/lead/status", {
          method: "POST",
          body: JSON.stringify({
            attempt: rec.job.attempt,
            status: r.dry_run && rec.status === "sent" ? "sent (dry run)" : rec.status,
            error: r.ok === false ? String(r.message || r.error || "") : "",
            purchased: !!rec.purchased || rec.status === "converted"
          })
        });
      } catch (e) {
        console.log("lead status failed", String(e));
      }
    }
    return rec;
  }

  // The instance named "leads" keeps one entry per checkout attempt.
  async leads(path, input) {
    const now = new Date().toISOString();
    if (path === "/lead/upsert" || path === "/lead/status") {
      const id = cleanId(input.attempt);
      if (!id) return { ok: false, error: "missing_attempt" };
      const key = "lead:" + id;
      const prev = await this.storage.get(key);
      if (path === "/lead/status" && !prev) return { ok: true };
      const next = path === "/lead/upsert"
        ? Object.assign({ attempt_id: id, created_at: now, call_status: input.status, call_error: "", purchased: false }, prev || {}, input.lead || {})
        : Object.assign({}, prev, { call_status: input.status, call_error: input.error || "", purchased: !!input.purchased || !!prev.purchased });
      next.updated_at = now;
      await this.storage.put(key, next);
      return { ok: true };
    }
    if (path === "/lead/list") {
      const all = await this.storage.list({ prefix: "lead:" });
      return [...all.values()].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    }
    if (path === "/lead/clear") {
      const keys = [...(await this.storage.list({ prefix: "lead:" })).keys()];
      for (let i = 0; i < keys.length; i += 128) await this.storage.delete(keys.slice(i, i + 128));
      return { ok: true, deleted: keys.length };
    }
    return { ok: false, error: "not_found" };
  }

  async takeRateLimitSlot(max) {
    const now = Date.now();
    const recent = ((await this.storage.get("calls")) || []).filter((ts) => now - ts < 3600 * 1000);
    if (recent.length >= (max || 6)) return { ok: false };
    recent.push(now);
    await this.storage.put("calls", recent);
    return { ok: true };
  }
}

/* ================================================================== Aircall */

async function callAircall(env, job) {
  if (isTrue(env.DRY_RUN)) {
    console.log("DRY_RUN", JSON.stringify(job));
    return { ok: true, dry_run: true, message: "DRY_RUN: Aircall request built, no call placed", request: job.request, url: job.url };
  }
  if (!env.AIRCALL_API_ID || !env.AIRCALL_API_TOKEN) {
    return { ok: false, error: "credentials_missing", message: "Set the AIRCALL_API_ID and AIRCALL_API_TOKEN secrets" };
  }

  let res, text;
  try {
    res = await fetch(job.url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(env.AIRCALL_API_ID + ":" + env.AIRCALL_API_TOKEN),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(job.request)
    });
    text = await res.text();
  } catch (e) {
    return { ok: false, error: "aircall_unreachable", message: String((e && e.message) || e) };
  }

  let data = null;
  try { data = JSON.parse(text); } catch (e) { /* keep text */ }
  console.log("Aircall response", res.status, text.slice(0, 500));

  if (!res.ok) {
    return {
      ok: false,
      error: "aircall_error",
      aircall_status: res.status,
      message: explainAircallError(res.status, data),
      aircall_response: data || text.slice(0, 500)
    };
  }
  if (data && data.status === "REJECTED") {
    return {
      ok: false,
      error: "aircall_rejected",
      message: data.error_message || "Aircall rejected the call (eligibility or number configuration)",
      aircall_response: data
    };
  }
  return { ok: true, aircall_status: res.status, event_id: data && data.id, event_status: data && data.status };
}

// Aircall's own explanation, wherever it sits in the response (it can be nested).
function aircallReason(data, depth) {
  if (!data || typeof data !== "object" || (depth || 0) > 3) return "";
  if (typeof data.error_message === "string" && data.error_message) return data.error_message;
  for (const k of ["message", "error", "detail", "errors"]) {
    const v = data[k];
    if (typeof v === "string" && v) return v;
    const nested = aircallReason(Array.isArray(v) ? v[0] : v, (depth || 0) + 1);
    if (nested) return nested;
  }
  return "";
}

function explainAircallError(status, data) {
  const detail = aircallReason(data) || (data ? JSON.stringify(data) : "");
  const hints = {
    400: "Bad request (check the phone format or the context fields)",
    401: "Unauthorized (check AIRCALL_API_ID and AIRCALL_API_TOKEN)",
    403: "Forbidden (the API key may not have access to this agent)",
    404: "Agent not found (check AGENT_ID)",
    409: "Conflict (usually: no phone number is assigned to the outbound agent in the Aircall Dashboard)",
    422: "Validation error from Aircall",
    429: "Rate limited by Aircall"
  };
  const base = hints[status] || "Aircall returned HTTP " + status;
  const extra = typeof detail === "string" ? detail : JSON.stringify(detail);
  return extra ? base + ": " + extra.slice(0, 600) : base;
}

/* ================================================================== helpers */

function timer(env, name) {
  return env.CHECKOUTS.get(env.CHECKOUTS.idFromName(name));
}

async function takeSlot(env, name, max) {
  const res = await timer(env, name).fetch("https://timer/limit", { method: "POST", body: JSON.stringify({ max }) });
  return !!(await res.json()).ok;
}

function adminAuthorized(request, env) {
  const m = /^Basic\s+(.+)$/i.exec(request.headers.get("Authorization") || "");
  if (!m) return false;
  let decoded = "";
  try { decoded = atob(m[1]); } catch (e) { return false; }
  const given = decoded.slice(decoded.indexOf(":") + 1);
  const expected = String(env.LEADS_ADMIN_KEY);
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  return diff === 0;
}

const LEAD_COLUMNS = ["created_at", "first_name", "last_name", "phone", "email", "language", "cart_items",
  "cart_total", "call_status", "call_error", "purchased", "follow_up_ok", "updated_at", "attempt_id"];

function leadsCsv(rows) {
  const cell = (v, col) => {
    let s = v == null ? "" : String(v);
    // Visitors type these values: stop spreadsheets from running them as formulas.
    if (col !== "phone" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [LEAD_COLUMNS.join(",")].concat(
    (Array.isArray(rows) ? rows : []).map((r) => LEAD_COLUMNS.map((c) => cell(r[c], c)).join(","))
  );
  return "\uFEFF" + lines.join("\r\n") + "\r\n"; // BOM so Excel reads accents correctly
}

// What the store is allowed to see about a checkout: no phone, no cart.
function view(rec) {
  const r = rec.result || null;
  return {
    ok: true,
    status: rec.status,
    remaining_ms: rec.status === "armed" && rec.deadline ? Math.max(0, rec.deadline - Date.now()) : null,
    purchased: !!rec.purchased,
    result: r && {
      ok: r.ok,
      dry_run: !!r.dry_run,
      error: r.error || null,
      message: r.message || null,
      aircall_status: r.aircall_status || null,
      event_id: r.event_id || null
    }
  };
}

async function relay(res, cors) {
  return new Response(res.body, {
    status: res.status,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, cors)
  });
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers || {})
  });
}

function list(v) {
  return String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function isTrue(v) {
  return /^(1|true|yes|on)$/i.test(String(v || "").trim());
}

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function originAllowed(origin, env) {
  const allowed = list(env.ALLOWED_ORIGINS);
  if (allowed.includes("*")) return true;
  if (!origin) return false;
  return allowed.some((a) => a.replace(/\/+$/, "") === origin);
}

function corsHeaders(origin) {
  // Echo the origin so the store can read error messages. Access is enforced by
  // originAllowed() before anything happens, and by the phone allowlist.
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function normalizePhone(v) {
  const s = String(v || "").replace(/[\s.\-()/]/g, "").replace(/^00/, "+");
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

function phoneAllowed(phone, env) {
  const exact = list(env.ALLOWED_NUMBERS).map(normalizePhone).filter(Boolean);
  const prefixes = list(env.ALLOWED_PHONE_PREFIXES).map((p) => p.replace(/[\s.\-()]/g, "").replace(/^00/, "+"));
  if (!exact.length && !prefixes.length) {
    return { ok: false, message: "No ALLOWED_NUMBERS or ALLOWED_PHONE_PREFIXES configured on the Worker" };
  }
  if (exact.includes(phone)) return { ok: true };
  if (prefixes.some((p) => p === "*" || phone.startsWith(p))) return { ok: true };
  return { ok: false, message: "This number is not on the demo allowlist" };
}

function cleanText(v, max) {
  return String(v == null ? "" : v)
    .replace(/[\u0000-\u001F\u007F<>{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanId(v) {
  const s = String(v || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  return s.length >= 6 ? s : "";
}

function cleanContext(ctx, lang) {
  const out = {};
  const src = ctx && typeof ctx === "object" ? ctx : {};
  for (const key of CONTEXT_KEYS) {
    out[key] = cleanText(src[key], key === "cart_items" || key === "shipping_note" ? 400 : 120);
  }
  out.language = lang;
  return out;
}

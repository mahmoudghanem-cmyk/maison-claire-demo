/**
 * Cloudflare Worker: abandoned cart -> Aircall AI Voice Agent outbound call.
 *
 * The static store (GitHub Pages) cannot hold Aircall API credentials, so it
 * POSTs the abandoned cart here. This Worker validates the request and calls:
 *
 *   POST {AIRCALL_API_BASE}/v1/outbound-calls/agents/{agentId}
 *
 * Paste this file into a Worker (Cloudflare dashboard > Workers > Create > Edit code)
 * and set these variables under Settings > Variables and Secrets:
 *
 *   AIRCALL_API_ID          (secret)  Aircall API ID
 *   AIRCALL_API_TOKEN       (secret)  Aircall API token
 *   AGENT_ID_EN                       outbound agent ID used when the shopper browsed in English
 *   AGENT_ID_FR                       outbound agent ID used when the shopper browsed in French
 *   AGENT_ID                          fallback agent ID (if you use a single agent)
 *   ALLOWED_ORIGINS                   comma list, e.g. "https://you.github.io,http://localhost:8080"
 *   ALLOWED_NUMBERS                   comma list of exact E.164 numbers allowed to be called, and/or
 *   ALLOWED_PHONE_PREFIXES            comma list of prefixes, e.g. "+33,+44". At least one of the two
 *                                     is required: the Worker refuses to dial anything otherwise.
 *   DEMO_PASSCODE           (secret, optional) if set, requests must carry this passcode
 *   DRY_RUN                           "true" returns the Aircall request without calling Aircall
 *   AIRCALL_API_BASE                  optional, default https://api.aircall.io
 *   EXPIRATION_SECONDS                optional, default 300 (call attempt expires after 5 minutes)
 *   MAX_CALLS_PER_NUMBER_PER_HOUR     optional, default 6 (best effort, per Worker instance)
 */

const CONTEXT_KEYS = [
  "contact_first_name",
  "contact_last_name",
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

const recentCalls = new Map(); // phone -> [timestamps], best effort rate limit per isolate

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method === "GET") {
      return json({ ok: true, service: "cart-recovery-call", dry_run: isTrue(env.DRY_RUN) }, 200, cors);
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

    if (env.DEMO_PASSCODE && String(body.passcode || "") !== String(env.DEMO_PASSCODE)) {
      return json({ ok: false, error: "invalid_passcode", message: "Wrong or missing demo passcode" }, 401, cors);
    }

    const phone = normalizePhone(body.phone);
    if (!phone) return json({ ok: false, error: "invalid_phone", message: "Phone must be E.164, e.g. +33612345678" }, 400, cors);

    const allow = phoneAllowed(phone, env);
    if (!allow.ok) return json({ ok: false, error: "phone_not_allowed", message: allow.message }, 403, cors);

    if (!rateLimitOk(phone, env)) {
      return json({ ok: false, error: "rate_limited", message: "Too many calls to this number, try again later" }, 429, cors);
    }

    const lang = body.lang === "fr" ? "fr" : "en";
    const agentId = (lang === "fr" ? env.AGENT_ID_FR : env.AGENT_ID_EN) || env.AGENT_ID;
    if (!agentId) {
      return json({ ok: false, error: "agent_not_configured", message: "Set AGENT_ID_EN / AGENT_ID_FR or AGENT_ID" }, 500, cors);
    }

    const context = cleanContext(body.context, lang);
    const attempt = cleanId(body.attempt_id) || cleanId(body.checkout_id) || crypto.randomUUID();
    const firstName = cleanText(body.first_name, 60);
    const lastName = cleanText(body.last_name, 60);

    const aircallRequest = {
      contact_phone: phone,
      contact_name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
      idempotency_key: "cart-recovery-" + attempt,
      context,
      expiration_seconds: clampInt(env.EXPIRATION_SECONDS, 60, 86400, 300)
    };

    const base = String(env.AIRCALL_API_BASE || "https://api.aircall.io").replace(/\/+$/, "");
    const url = base + "/v1/outbound-calls/agents/" + encodeURIComponent(agentId);

    if (isTrue(env.DRY_RUN)) {
      console.log("DRY_RUN", JSON.stringify({ url, aircallRequest }));
      return json({ ok: true, dry_run: true, url, agent_id: agentId, request: aircallRequest }, 200, cors);
    }

    if (!env.AIRCALL_API_ID || !env.AIRCALL_API_TOKEN) {
      return json({ ok: false, error: "credentials_missing", message: "Set AIRCALL_API_ID and AIRCALL_API_TOKEN" }, 500, cors);
    }

    let res, text;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(env.AIRCALL_API_ID + ":" + env.AIRCALL_API_TOKEN),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(aircallRequest)
      });
      text = await res.text();
    } catch (e) {
      return json({ ok: false, error: "aircall_unreachable", message: String(e && e.message || e) }, 502, cors);
    }

    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* keep text */ }
    console.log("Aircall response", res.status, text.slice(0, 500));

    if (!res.ok) {
      return json({
        ok: false,
        error: "aircall_error",
        aircall_status: res.status,
        message: explainAircallError(res.status, data, text),
        aircall_response: data || text.slice(0, 500)
      }, 502, cors);
    }

    if (data && data.status === "REJECTED") {
      return json({
        ok: false,
        error: "aircall_rejected",
        message: data.error_message || "Aircall rejected the call (eligibility or number configuration)",
        aircall_response: data
      }, 502, cors);
    }

    recordCall(phone);
    return json({
      ok: true,
      aircall_status: res.status,
      event_id: data && data.id,
      event_status: data && data.status,
      agent_id: agentId
    }, 200, cors);
  }
};

/* ------------------------------------------------------------------ helpers */

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers)
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

function corsHeaders(origin, env) {
  const h = {
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
  // Echo the origin so the store can read error messages. Access is enforced by
  // originAllowed() before anything happens, and by the phone allowlist.
  h["Access-Control-Allow-Origin"] = origin || "*";
  return h;
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

function rateLimitOk(phone, env) {
  const max = clampInt(env.MAX_CALLS_PER_NUMBER_PER_HOUR, 1, 1000, 6);
  const now = Date.now();
  const recent = (recentCalls.get(phone) || []).filter((ts) => now - ts < 3600 * 1000);
  recentCalls.set(phone, recent);
  return recent.length < max;
}

function recordCall(phone) {
  const recent = recentCalls.get(phone) || [];
  recent.push(Date.now());
  recentCalls.set(phone, recent);
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
    const val = cleanText(src[key], key === "cart_items" || key === "shipping_note" ? 400 : 120);
    out[key] = val;
  }
  out.language = lang;
  return out;
}

function explainAircallError(status, data, text) {
  const detail = (data && (data.message || data.error || data.detail)) || "";
  const hints = {
    400: "Bad request (check the phone format or the context fields)",
    401: "Unauthorized (check AIRCALL_API_ID and AIRCALL_API_TOKEN)",
    403: "Forbidden (the API key may not have access to this agent)",
    404: "Agent not found (check the agent ID and the API base URL)",
    409: "Conflict (usually: no phone number is assigned to the outbound agent in the Aircall Dashboard)",
    422: "Validation error from Aircall",
    429: "Rate limited by Aircall"
  };
  const base = hints[status] || "Aircall returned HTTP " + status;
  const extra = typeof detail === "string" ? detail : JSON.stringify(detail);
  return extra ? base + ": " + extra.slice(0, 200) : base;
}

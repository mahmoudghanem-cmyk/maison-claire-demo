/*
 * Maison Claire demo storefront.
 *
 * Flow that triggers the Aircall voice agent:
 *   1. Shopper adds products and goes to checkout.
 *   2. Shopper fills the contact step (first name, mobile, consent) and continues.
 *      This is the moment Shopify would record an "abandoned checkout".
 *   3. A timer starts (30 s by default). Any cart change restarts it.
 *   4. If the order is not completed before the timer ends, the store POSTs the
 *      cart to the call endpoint (a Cloudflare Worker), which asks Aircall to
 *      place the outbound AI voice agent call.
 *   5. Completing the order cancels the timer.
 */
(function () {
  "use strict";

  const CFG = window.STORE_CONFIG || {};
  const CATALOG = window.CATALOG || [];
  const I18N = window.I18N || {};
  const PRODUCTS = Object.fromEntries(CATALOG.map((p) => [p.id, p]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const COUNTRIES = [
    { code: "FR", dial: "33", en: "France", fr: "France" },
    { code: "BE", dial: "32", en: "Belgium", fr: "Belgique" },
    { code: "CH", dial: "41", en: "Switzerland", fr: "Suisse" },
    { code: "LU", dial: "352", en: "Luxembourg", fr: "Luxembourg" },
    { code: "GB", dial: "44", en: "United Kingdom", fr: "Royaume-Uni" },
    { code: "IE", dial: "353", en: "Ireland", fr: "Irlande" },
    { code: "US", dial: "1", en: "United States", fr: "États-Unis" },
    { code: "CA", dial: "1", en: "Canada", fr: "Canada" },
    { code: "ES", dial: "34", en: "Spain", fr: "Espagne" },
    { code: "DE", dial: "49", en: "Germany", fr: "Allemagne" },
    { code: "NL", dial: "31", en: "Netherlands", fr: "Pays-Bas" },
    { code: "IT", dial: "39", en: "Italy", fr: "Italie" }
  ];

  /* ------------------------------------------------------------------ storage */
  const ls = {
    get(key, fallback) {
      try { const raw = localStorage.getItem(key); return raw == null ? fallback : JSON.parse(raw); }
      catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ } },
    del(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };
  const K = {
    lang: "mc_lang", cart: "mc_cart", checkout: "mc_checkout", recovery: "mc_recovery",
    discount: "mc_discount", order: "mc_last_order", delay: "mc_delay", passcode: "mc_passcode",
    panel: "mc_demo_panel"
  };

  // Per-visit options: ?delay=10  ?demo=0  ?lang=fr  ?passcode=xxxx
  (function readUrlOptions() {
    const params = new URLSearchParams(location.search);
    let strip = false;
    if (params.has("delay")) {
      const d = parseInt(params.get("delay"), 10);
      if (d >= 5 && d <= 3600) ls.set(K.delay, d);
    }
    if (params.has("demo")) ls.set(K.panel, params.get("demo") === "0" ? "hidden" : "auto");
    if (params.has("lang") && /^(en|fr)$/.test(params.get("lang"))) ls.set(K.lang, params.get("lang"));
    if (params.has("passcode")) { ls.set(K.passcode, params.get("passcode")); params.delete("passcode"); strip = true; }
    if (strip) {
      const q = params.toString();
      history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
    }
  })();

  const state = {
    lang: ls.get(K.lang, null) || ((navigator.language || "en").toLowerCase().indexOf("fr") === 0 ? "fr" : "en"),
    cart: sanitizeCart(ls.get(K.cart, [])),
    checkout: ls.get(K.checkout, null), // { id, token, firstName, lastName, email, country, phoneLocal, phone, consent }
    recovery: ls.get(K.recovery, { status: "idle" }),
    discount: ls.get(K.discount, ""),
    // "auto" = small pill while idle, expands by itself once the countdown starts
    panel: ls.get(K.panel, CFG.showDemoPanel === false ? "hidden" : "auto"),
    draft: null,
    pageQty: 1,
    lastRoute: null
  };

  function sanitizeCart(cart) {
    if (!Array.isArray(cart)) return [];
    return cart
      .filter((l) => l && PRODUCTS[l.id] && Number.isInteger(l.qty) && l.qty > 0)
      .map((l) => ({ id: l.id, qty: Math.min(l.qty, 20) }));
  }

  /* ------------------------------------------------------------------ helpers */
  function t(key, vars) {
    const dict = I18N[state.lang] || I18N.en || {};
    let s = dict[key] != null ? dict[key] : (I18N.en && I18N.en[key] != null ? I18N.en[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const name = (p) => p.name[state.lang] || p.name.en;

  function money(n) {
    const whole = Math.abs(n - Math.round(n)) < 0.005;
    return new Intl.NumberFormat(state.lang === "fr" ? "fr-FR" : "en-IE", {
      style: "currency", currency: CFG.currency || "EUR",
      minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2
    }).format(n);
  }

  function totals() {
    const subtotal = state.cart.reduce((s, l) => s + PRODUCTS[l.id].price * l.qty, 0);
    const count = state.cart.reduce((s, l) => s + l.qty, 0);
    const discount = state.discount === CFG.discountCode ? Math.round(subtotal * CFG.discountPercent) / 100 : 0;
    const shipping = subtotal === 0 || subtotal >= CFG.freeShippingThreshold ? 0 : CFG.shippingFee;
    return { subtotal, count, discount, shipping, total: subtotal - discount + shipping };
  }

  function randomToken() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
  const newCheckoutRef = () => "MC-" + String(Math.floor(10000 + Math.random() * 90000));

  function normalizePhone(raw, dial) {
    let s = String(raw || "").replace(/[\s.\-()/]/g, "");
    if (!s) return null;
    if (s.indexOf("00") === 0) s = "+" + s.slice(2);
    if (s[0] !== "+") {
      if (dial !== "39") s = s.replace(/^0+/, ""); // Italian numbers keep their leading 0
      s = "+" + dial + s;
    }
    return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
  }
  function maskPhone(p) {
    if (!p) return "—";
    return p.slice(0, 4) + " " + p.slice(4, -2).replace(/\d/g, "•") + " " + p.slice(-2);
  }

  /* -------------------------------------------- spoken text for the voice agent */
  const NUM_WORDS = {
    en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
    fr: ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"]
  };
  function spokenCount(n, lang, gender) {
    if (lang === "fr" && n === 1) return gender === "f" ? "une" : "un";
    return n <= 10 ? NUM_WORDS[lang][n] : String(n);
  }
  function spokenMoney(n, lang) {
    const whole = Math.abs(n - Math.round(n)) < 0.005;
    if (whole) return Math.round(n) + (Math.round(n) === 1 ? " euro" : " euros");
    const v = n.toFixed(2);
    return (lang === "fr" ? v.replace(".", ",") : v) + " euros";
  }
  function spokenItems(lang) {
    const parts = state.cart.map((l) => {
      const p = PRODUCTS[l.id];
      const forms = p.spoken[lang];
      return spokenCount(l.qty, lang, p.gender) + " " + (l.qty > 1 ? forms[1] : forms[0]);
    });
    if (parts.length <= 1) return parts.join("");
    return parts.slice(0, -1).join(", ") + (lang === "fr" ? " et " : " and ") + parts[parts.length - 1];
  }

  function buildCallPayload() {
    const c = state.checkout;
    const lang = state.lang;
    const tt = totals();
    const threshold = CFG.freeShippingThreshold;
    const gap = threshold - tt.subtotal;
    const shippingNote = gap <= 0
      ? (lang === "fr" ? "La livraison est offerte pour cette commande." : "Shipping is free on this order.")
      : (lang === "fr"
        ? "La livraison coûte " + spokenMoney(CFG.shippingFee, lang) + ". En ajoutant " + spokenMoney(gap, lang) + " d'articles, elle serait offerte."
        : "Shipping is " + spokenMoney(CFG.shippingFee, lang) + ". Adding " + spokenMoney(gap, lang) + " more would make shipping free.");
    const payload = {
      checkout_id: c.id,
      attempt_id: c.token,
      lang: lang,
      phone: c.phone,
      first_name: c.firstName,
      last_name: c.lastName || "",
      context: {
        contact_first_name: c.firstName,
        contact_last_name: c.lastName || "",
        language: lang,
        store_name: CFG.storeName,
        cart_reference: c.id,
        cart_items: spokenItems(lang),
        cart_item_count: String(tt.count),
        cart_total: spokenMoney(tt.subtotal, lang),
        shipping_note: shippingNote,
        discount_code: CFG.discountCode,
        discount_offer: lang === "fr"
          ? CFG.discountPercent + " pour cent de réduction sur toute la commande"
          : CFG.discountPercent + " percent off the whole order"
      }
    };
    const passcode = ls.get(K.passcode, "");
    if (passcode) payload.passcode = passcode;
    return payload;
  }

  /* ------------------------------------------------------- cart abandonment */
  /*
   * Two modes:
   *  - Server mode (callEndpoint set): the 30 s timer lives in the Cloudflare Worker.
   *    The store "arms" it as soon as name + phone + consent are known, re-arms on any
   *    change, and settles it when the order completes. Closing the tab does not stop it.
   *  - Dry run (no callEndpoint): the timer runs here and only shows the payload.
   */
  const endpoint = () => String(CFG.callEndpoint || "").replace(/\/+$/, "");
  const serverMode = () => !!endpoint();

  async function api(body) {
    // text/plain keeps this a "simple" CORS request (no preflight).
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(body),
      keepalive: true
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* non JSON */ }
    if (!res.ok || data.ok === false) throw new Error(data.message || data.error || "HTTP " + res.status);
    return data;
  }

  const recovery = {
    armTimer: null,
    polling: false,
    delay() { return ls.get(K.delay, null) || CFG.abandonDelaySeconds || 30; },
    set(next) { state.recovery = next; ls.set(K.recovery, next); renderPanel(); },
    eligible() {
      const c = state.checkout;
      return !!(c && c.id && c.token && c.phone && c.consent && state.cart.length);
    },
    alreadyHandled() {
      const r = state.recovery;
      return state.checkout && r.checkoutId === state.checkout.id && ["sending", "sent", "dry", "converted"].indexOf(r.status) !== -1;
    },
    base() {
      const c = state.checkout;
      return { checkoutId: c.id, token: c.token, phone: c.phone };
    },
    // Map the Worker's view of a checkout onto the panel state.
    fromServer(v, base) {
      const b = base || this.base();
      switch (v.status) {
        case "armed": return this.set(Object.assign({}, b, { status: "armed", deadline: Date.now() + (v.remaining_ms || 0) }));
        case "calling": return this.set(Object.assign({}, b, { status: "sending" }));
        case "sent": return this.set(Object.assign({}, b, { status: "sent", response: v.result || {} }));
        case "error": return this.set(Object.assign({}, b, { status: "error", message: (v.result && (v.result.message || v.result.error)) || "error" }));
        case "converted": return this.set(Object.assign({}, b, { status: "converted" }));
        case "cancelled": return this.set(Object.assign({}, b, { status: "cancelled" }));
        default: return this.set({ status: "idle" });
      }
    },
    arm() {
      if (!this.eligible() || this.alreadyHandled()) return;
      // Show the countdown at once; the Worker's answer corrects it a moment later.
      this.set(Object.assign(this.base(), { status: "armed", deadline: Date.now() + this.delay() * 1000 }));
      if (!serverMode()) return;
      clearTimeout(this.armTimer);
      this.armTimer = setTimeout(() => this.sendArm(), 400);
    },
    async sendArm() {
      this.armTimer = null;
      if (!this.eligible()) return;
      const base = this.base();
      const body = Object.assign(buildCallPayload(), { action: "arm", delay_seconds: this.delay() });
      try { this.fromServer(await api(body), base); }
      catch (err) { this.set(Object.assign(base, { status: "error", message: String((err && err.message) || err) })); }
    },
    // Tell the Worker to drop a timer (consent removed, cart emptied, phone changed, reset).
    disarm(token, nextStatus) {
      clearTimeout(this.armTimer);
      this.armTimer = null;
      if (serverMode() && token) api({ action: "cancel", attempt_id: token }).catch(() => {});
      if (nextStatus) this.set({ status: nextStatus, checkoutId: state.recovery.checkoutId });
    },
    onCartChange() {
      if (state.recovery.status !== "armed") return;
      if (!state.cart.length) this.disarm(state.recovery.token, "idle");
      else this.arm(); // activity restarts the countdown with the new cart
    },
    cancel() {
      if (["armed", "error", "dry"].indexOf(state.recovery.status) === -1) return;
      this.disarm(state.recovery.token, "cancelled");
    },
    complete() {
      clearTimeout(this.armTimer);
      this.armTimer = null;
      const token = state.checkout && state.checkout.token;
      if (serverMode() && token) api({ action: "complete", attempt_id: token }).catch(() => {});
      this.set({ status: "converted", checkoutId: state.checkout && state.checkout.id });
    },
    tick() {
      const r = state.recovery;
      if (r.status === "sending" && serverMode()) return this.poll();
      if (r.status !== "armed") return;
      const left = r.deadline - Date.now();
      if (left > 0) return updateCountdown(left);
      if (serverMode()) {
        // The Worker places the call (even with the tab closed); we just watch the result.
        this.set(Object.assign({}, r, { status: "sending" }));
        return this.poll();
      }
      if (left < -10 * 60 * 1000) return this.set({ status: "idle" }); // stale dry-run timer
      this.fire();
    },
    async poll() {
      const r = state.recovery;
      if (this.polling || !r.token) return;
      this.polling = true;
      try {
        for (let i = 0; i < 30; i++) {
          const res = await fetch(endpoint() + "/status?id=" + encodeURIComponent(r.token));
          const v = await res.json();
          if (state.recovery.token !== r.token) break; // checkout changed meanwhile
          if (v.status === "armed" || v.status === "calling") {
            if (v.status === "armed") { this.fromServer(v, r); break; }
            await new Promise((ok) => setTimeout(ok, 1500));
            continue;
          }
          this.fromServer(v, r);
          break;
        }
      } catch (err) {
        this.set(Object.assign({}, r, { status: "error", message: String((err && err.message) || err) }));
      } finally {
        this.polling = false;
      }
    },
    // "Call now" on the presenter panel: skip the countdown.
    async fire() {
      if (state.recovery.status === "sending" && serverMode()) return;
      if (!this.eligible()) { renderPanel(t("demo_need_contact")); return; }
      clearTimeout(this.armTimer);
      this.armTimer = null;
      const base = this.base();
      const payload = buildCallPayload();
      this.set(Object.assign({}, base, { status: "sending" }));
      if (!serverMode()) {
        console.info("[cart-recovery] DRY RUN, no callEndpoint configured. Payload:", payload);
        return this.set(Object.assign({}, base, { status: "dry", payload: payload }));
      }
      try { this.fromServer(await api(Object.assign(payload, { action: "call_now" })), base); }
      catch (err) { this.set(Object.assign({}, base, { status: "error", message: String((err && err.message) || err) })); }
    },
    // A change made just before the tab closes still reaches the Worker.
    onPageHide() {
      if (!serverMode() || !this.armTimer || !this.eligible()) return;
      clearTimeout(this.armTimer);
      this.armTimer = null;
      const body = Object.assign(buildCallPayload(), { action: "arm", delay_seconds: this.delay() });
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint(), new Blob([JSON.stringify(body)], { type: "text/plain;charset=UTF-8" }));
    },
    // Coming back to the page: ask the Worker what happened while we were away.
    onLoad() {
      const r = state.recovery;
      if (serverMode() && r.token && (r.status === "armed" || r.status === "sending")) {
        this.polling = false;
        this.set(Object.assign({}, r, { status: "sending" }));
        this.poll();
      }
    }
  };

  /* ------------------------------------------------------------------ cart ops */
  function saveCart() {
    ls.set(K.cart, state.cart);
    renderCartBits();
    recovery.onCartChange();
  }
  function addToCart(id, qty) {
    const line = state.cart.find((l) => l.id === id);
    if (line) line.qty = Math.min(line.qty + qty, 20);
    else state.cart.push({ id: id, qty: qty });
    saveCart();
    openCart();
  }
  function setQty(id, qty) {
    const line = state.cart.find((l) => l.id === id);
    if (!line) return;
    if (qty <= 0) state.cart = state.cart.filter((l) => l.id !== id);
    else line.qty = Math.min(qty, 20);
    saveCart();
    if (document.body.classList.contains("is-checkout")) render();
  }

  /* ------------------------------------------------------------------ icons */
  const ICON = {
    truck: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 9.5h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    returns: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4v4h4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5" stroke-linecap="round"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
  };

  /* ------------------------------------------------------------------ views */
  function viewHome() {
    const cards = CATALOG.map(card).join("");
    return `
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <p class="eyebrow">${t("hero_eyebrow")}</p>
            <h1>${t("hero_title")}</h1>
            <p class="lead">${t("hero_text")}</p>
            <a class="btn" href="#/shop">${t("hero_cta")}</a>
          </div>
          <div class="hero-art">
            <a href="#/product/blanket" aria-label="${esc(name(PRODUCTS.blanket))}">${PRODUCTS.blanket.art}</a>
            <a href="#/product/candle" aria-label="${esc(name(PRODUCTS.candle))}">${PRODUCTS.candle.art}</a>
            <a href="#/product/mug" aria-label="${esc(name(PRODUCTS.mug))}">${PRODUCTS.mug.art}</a>
          </div>
        </div>
      </section>
      <section class="perks">
        <div class="container perks-grid">
          <div class="perk">${ICON.truck}<span>${t("perk_shipping", { amount: money(CFG.freeShippingThreshold) })}</span></div>
          <div class="perk">${ICON.returns}<span>${t("perk_returns")}</span></div>
          <div class="perk">${ICON.lock}<span>${t("perk_secure")}</span></div>
        </div>
      </section>
      <section class="section" id="shop">
        <div class="container">
          <div class="section-head">
            <h2>${t("collection_title")}</h2>
            <p>${t("collection_sub")}</p>
          </div>
          <div class="grid">${cards}</div>
        </div>
      </section>
      <section class="section about" id="about">
        <div class="container about-inner">
          <div class="about-art">
            <a href="#/product/lamp" aria-label="${esc(name(PRODUCTS.lamp))}">${PRODUCTS.lamp.art}</a>
            <a href="#/product/towel" aria-label="${esc(name(PRODUCTS.towel))}">${PRODUCTS.towel.art}</a>
          </div>
          <div>
            <p class="eyebrow">${esc(CFG.storeName)}</p>
            <h2>${t("about_title")}</h2>
            <p>${t("about_text")}</p>
          </div>
        </div>
      </section>`;
  }

  function card(p) {
    return `
      <article class="card">
        <a class="card-media" href="#/product/${p.id}" aria-label="${esc(name(p))}">${p.art}</a>
        <div class="card-body">
          <a class="card-title" href="#/product/${p.id}">${esc(name(p))}</a>
          <p class="card-short">${esc(p.short[state.lang])}</p>
          <p class="card-price">${money(p.price)}</p>
        </div>
        <button type="button" class="btn btn-outline btn-sm" data-add="${p.id}">${t("add_to_cart")}</button>
      </article>`;
  }

  function viewProduct(id) {
    const p = PRODUCTS[id];
    if (!p) {
      return `<div class="container product"><a class="back-link" href="#/shop">${ICON.back}${t("back_to_shop")}</a><p>${t("not_found")}</p></div>`;
    }
    const specs = p.details[state.lang].map((d) => `<div><dt>${esc(d[0])}</dt><dd>${esc(d[1])}</dd></div>`).join("");
    const related = CATALOG.filter((x) => x.id !== id).slice(0, 4).map(card).join("");
    return `
      <div class="container product">
        <a class="back-link" href="#/shop">${ICON.back}${t("back_to_shop")}</a>
        <div class="product-grid">
          <div class="product-media">${p.art}</div>
          <div class="product-info">
            <h1>${esc(name(p))}</h1>
            <p class="product-price">${money(p.price)}</p>
            <p class="lead">${esc(p.short[state.lang])}</p>
            <span class="qty-label">${t("quantity")}</span>
            <div class="stepper">
              <button type="button" data-page-qty="-1" aria-label="${t("decrease")}">−</button>
              <output id="page-qty" aria-live="polite">${state.pageQty}</output>
              <button type="button" data-page-qty="1" aria-label="${t("increase")}">+</button>
            </div>
            <div class="product-actions">
              <button type="button" class="btn btn-block" data-add-page="${p.id}">${t("add_to_cart")}</button>
            </div>
            <p class="product-ship">${ICON.truck}<span>${t("product_shipping")}</span></p>
            <p class="product-desc">${esc(p.description[state.lang])}</p>
            <dl class="specs">${specs}</dl>
          </div>
        </div>
        <section class="related">
          <h2>${state.lang === "fr" ? "Vous aimerez aussi" : "You may also like"}</h2>
          <div class="grid">${related}</div>
        </section>
      </div>`;
  }

  function summaryLines() {
    return state.cart.map((l) => {
      const p = PRODUCTS[l.id];
      return `
        <div class="sum-line">
          <div class="sum-thumb"><div>${p.art}</div><span class="qty">${l.qty}</span></div>
          <span class="sum-name">${esc(name(p))}</span>
          <span>${money(p.price * l.qty)}</span>
        </div>`;
    }).join("");
  }

  function summaryBlock() {
    const tt = totals();
    const applied = state.discount === CFG.discountCode;
    return `
      <div class="sum-lines">${summaryLines()}</div>
      <form class="discount-form" data-discount-form novalidate>
        <input name="code" autocomplete="off" placeholder="${t("discount_label")}" aria-label="${t("discount_label")}" value="${esc(applied ? state.discount : "")}">
        <button class="btn btn-sm" type="submit">${t("apply")}</button>
        ${applied ? `<p class="discount-msg ok">${t("code_applied", { code: esc(CFG.discountCode), percent: CFG.discountPercent })}</p>` : `<p class="discount-msg" data-discount-msg></p>`}
      </form>
      <div class="sum-rows">
        <div class="row"><span>${t("subtotal")}</span><span>${money(tt.subtotal)}</span></div>
        ${tt.discount ? `<div class="row"><span>${t("discount")} (${esc(CFG.discountCode)})</span><span>−${money(tt.discount)}</span></div>` : ""}
        <div class="row"><span>${t("shipping")}</span><span>${tt.shipping ? money(tt.shipping) : t("free")}</span></div>
        <div class="row row-total"><span>${t("total")}</span><span><small>${esc(CFG.currency)}</small>${money(tt.total)}</span></div>
      </div>`;
  }

  function checkoutShell(step, mainHtml) {
    const tt = totals();
    const crumbs = [
      `<a href="#/" data-open-cart>${t("crumb_cart")}</a>`,
      step === "info" ? `<span class="current">${t("crumb_info")}</span>` : `<a href="#/checkout">${t("crumb_info")}</a>`,
      step === "payment" ? `<span class="current">${t("crumb_payment")}</span>` : `<span>${t("crumb_payment")}</span>`
    ].join(`<span class="sep">${ICON.chevron}</span>`);
    return `
      <div class="checkout">
        <div class="checkout-main">
          <div class="checkout-main-inner">
            <div class="checkout-top">
              <a class="logo" href="#/">${esc(CFG.storeName)}</a>
              ${langToggle()}
            </div>
            <nav class="crumbs" aria-label="Checkout steps">${crumbs}</nav>
            <details class="summary-toggle">
              <summary><span>${t("show_summary")}</span><strong>${money(tt.total)}</strong></summary>
              <div class="summary-body">${summaryBlock()}</div>
            </details>
            ${mainHtml}
          </div>
        </div>
        <aside class="checkout-aside" aria-label="${t("order_summary")}">
          <div class="checkout-aside-inner">${summaryBlock()}</div>
        </aside>
      </div>`;
  }

  function emptyCheckout() {
    return `
      <div class="thanks">
        <p class="muted">${t("cart_empty")}</p>
        <a class="btn" href="#/shop">${t("continue_shopping")}</a>
      </div>`;
  }

  function viewInformation() {
    if (!state.cart.length) return emptyCheckout();
    const c = state.draft || state.checkout || {};
    const country = c.country || (state.lang === "fr" ? "FR" : "GB");
    const options = COUNTRIES.map((x) =>
      `<option value="${x.code}" ${x.code === country ? "selected" : ""}>+${x.dial} ${esc(x[state.lang])}</option>`
    ).join("");
    const form = `
      <form id="contact-form" novalidate>
        <h2>${t("contact_title")}</h2>
        <div class="fields">
          <div class="field-row">
            <div class="field" data-field="firstName">
              <label for="f-first">${t("first_name")}</label>
              <input id="f-first" name="firstName" autocomplete="given-name" value="${esc(c.firstName || "")}" required>
              <span class="field-error" data-error></span>
            </div>
            <div class="field">
              <label for="f-last">${t("last_name")}</label>
              <input id="f-last" name="lastName" autocomplete="family-name" value="${esc(c.lastName || "")}">
            </div>
          </div>
          <div class="field">
            <label for="f-email">${t("email")}</label>
            <input id="f-email" name="email" type="email" autocomplete="email" value="${esc(c.email || "")}">
          </div>
          <div class="field-row phone-row">
            <div class="field">
              <label for="f-country">${t("country")}</label>
              <select id="f-country" name="country" autocomplete="country">${options}</select>
            </div>
            <div class="field" data-field="phone">
              <label for="f-phone">${t("phone")}</label>
              <input id="f-phone" name="phoneLocal" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="${t("phone_placeholder")}" value="${esc(c.phoneLocal || "")}" required>
              <span class="field-error" data-error></span>
            </div>
          </div>
          <p class="help">${t("phone_help")}</p>
          <label class="check" data-field="consent">
            <input type="checkbox" name="consent" ${c.consent ? "checked" : ""}>
            <span>${t("consent", { store: esc(CFG.storeName) })}</span>
          </label>
          <span class="field-error" data-consent-error></span>
        </div>
        <div class="form-actions">
          <a href="#/" data-open-cart>‹ ${t("return_cart")}</a>
          <button class="btn" type="submit">${t("continue_payment")}</button>
        </div>
      </form>`;
    return checkoutShell("info", form);
  }

  function viewPayment() {
    if (!state.cart.length) return emptyCheckout();
    const c = state.checkout;
    if (!c || !c.phone || !c.consent) { location.replace("#/checkout"); return ""; }
    const main = `
      <div class="review">
        <div class="review-row"><span class="k">${t("contact_label")}</span><span>${esc(c.firstName)} ${esc(c.lastName || "")}${c.email ? " · " + esc(c.email) : ""}</span><a href="#/checkout">${t("change")}</a></div>
        <div class="review-row"><span class="k">${t("ship_to")}</span><span>${esc(c.phone)}</span><a href="#/checkout">${t("change")}</a></div>
      </div>
      <h2>${t("payment_title")}</h2>
      <p class="notice">${ICON.info}<span>${t("payment_note")}</span></p>
      <div class="pay-box">
        <label class="pay-option"><input type="radio" name="pay" value="card" checked> ${t("pay_card")}
          <span class="cards"><span class="pay-chip">VISA</span><span class="pay-chip">MC</span><span class="pay-chip">AMEX</span></span>
        </label>
        <div class="pay-detail" aria-hidden="true">
          <div class="pay-fake">•••• •••• •••• 4242</div>
          <div class="pay-fake-row"><div class="pay-fake">MM / YY</div><div class="pay-fake">CVC</div></div>
        </div>
        <label class="pay-option"><input type="radio" name="pay" value="paypal"> ${t("pay_paypal")}</label>
      </div>
      <div class="form-actions">
        <a href="#/checkout">‹ ${t("return_info")}</a>
        <button class="btn" type="button" data-complete-order>${t("complete_order")}</button>
      </div>`;
    return checkoutShell("payment", main);
  }

  function viewThanks() {
    const o = ls.get(K.order, null);
    if (!o) return emptyCheckout();
    return `
      <div class="checkout-top container" style="padding-top:28px">
        <a class="logo" href="#/">${esc(CFG.storeName)}</a>
        ${langToggle()}
      </div>
      <div class="thanks">
        <span class="tick">${ICON.check}</span>
        <p class="muted">${esc(o.ref)}</p>
        <h1>${t("thanks_title", { name: esc(o.firstName) })}</h1>
        <p class="muted">${t("thanks_text", { ref: esc(o.ref) })}</p>
        <a class="btn" href="#/">${t("thanks_back")}</a>
      </div>`;
  }

  function langToggle() {
    return `<div class="lang-toggle" role="group" aria-label="${t("switch_lang")}">
      <button type="button" data-lang="en" lang="en" aria-pressed="${state.lang === "en"}">EN</button>
      <button type="button" data-lang="fr" lang="fr" aria-pressed="${state.lang === "fr"}">FR</button>
    </div>`;
  }

  /* ------------------------------------------------------------------ drawer */
  function renderDrawer() {
    const drawer = $("#cart-drawer");
    const tt = totals();
    const head = `
      <div class="drawer-head">
        <h2 id="cart-title">${t("cart_title")}</h2>
        <button type="button" class="icon-btn" data-close-cart aria-label="${t("close")}">${ICON.close}</button>
      </div>`;
    if (!state.cart.length) {
      drawer.innerHTML = head + `
        <div class="drawer-empty">
          <p class="muted">${t("cart_empty")}</p>
          <a class="btn" href="#/shop" data-close-cart>${t("continue_shopping")}</a>
        </div>`;
      return;
    }
    const gap = CFG.freeShippingThreshold - tt.subtotal;
    const pct = Math.min(100, Math.round((tt.subtotal / CFG.freeShippingThreshold) * 100));
    const lines = state.cart.map((l) => {
      const p = PRODUCTS[l.id];
      return `
        <div class="line">
          <a class="line-media" href="#/product/${p.id}" data-close-cart aria-label="${esc(name(p))}">${p.art}</a>
          <div>
            <a class="line-title" href="#/product/${p.id}" data-close-cart>${esc(name(p))}</a>
            <span class="line-price">${money(p.price)}</span>
            <div class="stepper sm">
              <button type="button" data-qty="${p.id}" data-delta="-1" aria-label="${t("decrease")}">−</button>
              <span>${l.qty}</span>
              <button type="button" data-qty="${p.id}" data-delta="1" aria-label="${t("increase")}">+</button>
            </div>
          </div>
          <div class="line-end">
            <span>${money(p.price * l.qty)}</span>
            <button type="button" class="link-btn" data-remove="${p.id}">${t("remove")}</button>
          </div>
        </div>`;
    }).join("");
    drawer.innerHTML = head + `
      <div class="ship-progress">
        <span>${gap > 0 ? t("free_ship_progress", { amount: money(gap) }) : t("free_ship_unlocked")}</span>
        <div class="ship-bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="drawer-lines">${lines}</div>
      <div class="drawer-foot">
        <div class="row row-total"><span>${t("subtotal")}</span><span>${money(tt.subtotal)}</span></div>
        <p class="muted small">${t("taxes_note")}</p>
        <a class="btn btn-block" href="#/checkout" data-close-cart>${t("checkout")}</a>
      </div>`;
  }

  let lastFocus = null;
  function openCart() {
    renderDrawer();
    lastFocus = document.activeElement;
    document.body.classList.add("cart-open");
    $("#cart-drawer").setAttribute("aria-hidden", "false");
    setTimeout(() => { const b = $("#cart-drawer .icon-btn"); if (b) b.focus(); }, 50);
  }
  function closeCart() {
    if (!document.body.classList.contains("cart-open")) return;
    document.body.classList.remove("cart-open");
    $("#cart-drawer").setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function renderCartBits() {
    const count = totals().count;
    $$("[data-cart-count]").forEach((el) => { el.textContent = count; el.hidden = count === 0; });
    if (document.body.classList.contains("cart-open")) renderDrawer();
  }

  /* ------------------------------------------------------------------ demo panel */
  function renderPanel(flash) {
    const root = $("#demo-root");
    if (state.panel === "hidden") { root.innerHTML = ""; return; }
    const r = state.recovery;
    const live = !!CFG.callEndpoint;
    const c = state.checkout;
    const left = r.status === "armed" ? Math.max(0, r.deadline - Date.now()) : 0;
    const secs = Math.ceil(left / 1000);

    const quiet = ["idle", "converted", "cancelled"].indexOf(r.status) !== -1;
    const mode = state.panel === "auto" ? (quiet ? "min" : "open") : state.panel;
    if (mode === "min") {
      root.innerHTML = `<button type="button" class="demo-pill" data-demo="open"><span class="demo-dot ${r.status}"></span>${t("demo_title")}${r.status === "armed" ? ` · <span data-demo-secs>${secs}</span> s` : ""}</button>`;
      return;
    }

    let msg;
    switch (r.status) {
      case "armed": msg = t("demo_armed", { s: `<span data-demo-secs>${secs}</span>` }); break;
      case "sending": msg = t("demo_sending"); break;
      case "sent":
        msg = r.response && r.response.dry_run ? t("demo_worker_dry") : t("demo_sent", { phone: esc(maskPhone(r.phone)) });
        break;
      case "dry": msg = t("demo_dry"); break;
      case "error": msg = t("demo_error", { msg: esc(r.message) }); break;
      case "converted": msg = t("demo_converted"); break;
      case "cancelled": msg = t("demo_cancelled"); break;
      default: msg = t("demo_idle");
    }
    if (flash) msg = esc(flash);
    const delay = recovery.delay();
    const delays = [10, 20, 30, 45, 60, 120];
    if (delays.indexOf(delay) === -1) delays.push(delay);
    const delayOpts = delays.sort((a, b) => a - b).map((d) => `<option value="${d}" ${d === delay ? "selected" : ""}>${d} s</option>`).join("");
    const ring = r.status === "armed"
      ? `<div class="demo-ring" style="--p:${(left / (delay * 1000)).toFixed(3)}"><span data-demo-secs>${secs}</span></div>`
      : "";

    root.innerHTML = `
      <section class="demo-panel" aria-label="${t("demo_title")}">
        <div class="demo-head">
          <span class="demo-dot ${r.status}"></span>
          <strong>${t("demo_title")}</strong>
          <span class="demo-mode ${live ? "live" : ""}">${live ? t("demo_mode_live") : t("demo_mode_dry")}</span>
          <button type="button" class="demo-icon" data-demo="min" aria-label="${t("demo_hide")}">—</button>
        </div>
        <div class="demo-body">
          <div class="demo-status">${ring}<p class="demo-msg ${r.status}">${msg}</p></div>
          ${r.status === "dry" && r.payload ? `<pre class="demo-payload">${esc(JSON.stringify(r.payload, null, 2))}</pre>` : ""}
          <dl class="demo-meta">
            <div><dt>${t("phone")}</dt><dd>${esc(maskPhone(c && c.phone))}</dd></div>
            <div><dt>${t("demo_lang")}</dt><dd>${esc(I18N[state.lang].lang_name)}</dd></div>
            <div><dt>${t("demo_delay")}</dt><dd><select data-demo-delay aria-label="${t("demo_delay")}">${delayOpts}</select></dd></div>
            ${live ? `<div><dt>${t("demo_passcode")}</dt><dd><input type="password" data-demo-passcode value="${esc(ls.get(K.passcode, ""))}" autocomplete="off" aria-label="${t("demo_passcode")}"></dd></div>` : ""}
          </dl>
          <div class="demo-actions">
            <button type="button" class="primary" data-demo="call" ${r.status === "sending" ? "disabled" : ""}>${t("demo_call_now")}</button>
            <button type="button" data-demo="cancel" ${["armed", "error", "dry"].indexOf(r.status) === -1 ? "disabled" : ""}>${t("demo_cancel")}</button>
            <button type="button" data-demo="reset">${t("demo_reset")}</button>
          </div>
        </div>
      </section>`;
  }

  function updateCountdown(left) {
    const secs = Math.ceil(left / 1000);
    $$("[data-demo-secs]").forEach((el) => { el.textContent = secs; });
    const ring = $(".demo-ring");
    if (ring) ring.style.setProperty("--p", (left / (recovery.delay() * 1000)).toFixed(3));
  }

  function resetDemo() {
    recovery.disarm(state.checkout && state.checkout.token); // drop any timer on the Worker
    state.cart = [];
    ls.set(K.cart, state.cart);
    state.discount = "";
    ls.del(K.discount);
    if (state.checkout) {
      // keep name and phone to speed up the next run, but require a fresh consent and checkout
      state.checkout = { firstName: state.checkout.firstName, lastName: state.checkout.lastName, email: state.checkout.email, country: state.checkout.country, phoneLocal: state.checkout.phoneLocal };
      ls.set(K.checkout, state.checkout);
    }
    state.draft = null;
    recovery.set({ status: "idle" });
    renderCartBits();
    location.hash = "#/";
    render();
  }

  /* ------------------------------------------------------------------ toast */
  let toastTimer;
  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ------------------------------------------------------------------ render */
  function applyStaticI18n() {
    document.documentElement.lang = state.lang;
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-label]").forEach((el) => { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-label"))); });
    $$("[data-store-name]").forEach((el) => { el.textContent = CFG.storeName; });
    $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
    $$(".site-header [data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === state.lang)));
    $("#announcement").textContent = t("announcement", { amount: money(CFG.freeShippingThreshold) });
    document.title = CFG.storeName;
  }

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return { a: parts[0] || "", b: parts[1] || "" };
  }

  function render() {
    const r = route();
    const key = r.a + "/" + r.b;
    const changed = key !== state.lastRoute;
    if (changed && r.a === "product") state.pageQty = 1;
    document.body.classList.toggle("is-checkout", r.a === "checkout" || r.a === "thank-you");
    applyStaticI18n();

    let html;
    if (r.a === "product") html = viewProduct(r.b);
    else if (r.a === "checkout" && r.b === "payment") html = viewPayment();
    else if (r.a === "checkout") html = viewInformation();
    else if (r.a === "thank-you") html = viewThanks();
    else html = viewHome();
    $("#app").innerHTML = html;

    if (changed) {
      state.lastRouteWasHome = state.lastRoute != null && /^(|shop|about)\//.test(state.lastRoute);
      state.lastRoute = key;
      if (r.a === "shop" || r.a === "about") {
        const target = document.getElementById(r.a);
        if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: state.lastRouteWasHome ? "smooth" : "auto" }));
      } else {
        window.scrollTo(0, 0);
      }
    }
    renderCartBits();
    renderPanel();
  }

  /* ------------------------------------------------------------------ events */
  function readContactForm(form) {
    const fd = new FormData(form);
    return {
      firstName: String(fd.get("firstName") || "").trim().slice(0, 60),
      lastName: String(fd.get("lastName") || "").trim().slice(0, 60),
      email: String(fd.get("email") || "").trim().slice(0, 120),
      country: String(fd.get("country") || "FR"),
      phoneLocal: String(fd.get("phoneLocal") || "").trim().slice(0, 30),
      consent: fd.get("consent") === "on"
    };
  }

  // Save the shopper's details. A new phone number means a new checkout (and drops the old timer).
  function captureContact(v, phone) {
    const prev = state.checkout || {};
    const same = prev.phone === phone && prev.id && prev.token;
    if (!same && prev.token && state.recovery.status === "armed") recovery.disarm(prev.token);
    state.checkout = Object.assign({}, v, {
      phone: phone,
      id: same ? prev.id : newCheckoutRef(),
      token: same ? prev.token : randomToken()
    });
    ls.set(K.checkout, state.checkout);
  }

  // Like Shopify, capture the checkout as soon as the details are there, without waiting
  // for "Continue": a shopper who types their number and closes the tab still gets the call.
  function liveCapture(form) {
    if (!form || !state.cart.length) return;
    const v = readContactForm(form);
    const country = COUNTRIES.find((x) => x.code === v.country) || COUNTRIES[0];
    const phone = normalizePhone(v.phoneLocal, country.dial);
    if (v.firstName && phone && v.consent) {
      captureContact(v, phone);
      recovery.arm();
    } else if (!v.consent && state.checkout && state.checkout.consent) {
      // consent withdrawn: no call
      state.checkout.consent = false;
      ls.set(K.checkout, state.checkout);
      if (state.recovery.status === "armed") recovery.disarm(state.recovery.token, "idle");
    }
  }

  function submitContact(form) {
    const v = readContactForm(form);
    const country = COUNTRIES.find((x) => x.code === v.country) || COUNTRIES[0];
    const phone = normalizePhone(v.phoneLocal, country.dial);
    let ok = true;
    const setErr = (field, msg) => {
      const wrap = form.querySelector(`[data-field="${field}"]`);
      if (wrap) wrap.classList.toggle("invalid", !!msg);
      const out = field === "consent" ? form.querySelector("[data-consent-error]") : wrap && wrap.querySelector("[data-error]");
      if (out) out.textContent = msg || "";
      if (msg) ok = false;
    };
    setErr("firstName", v.firstName ? "" : t("err_first_name"));
    setErr("phone", phone ? "" : t("err_phone"));
    setErr("consent", v.consent ? "" : t("err_consent"));
    if (!ok) {
      const bad = form.querySelector(".invalid input, .invalid");
      if (bad && bad.focus) bad.focus();
      return;
    }
    captureContact(v, phone);
    state.draft = null;
    recovery.arm();
    location.hash = "#/checkout/payment";
  }

  function completeOrder() {
    const c = state.checkout;
    const tt = totals();
    ls.set(K.order, { ref: c.id, firstName: c.firstName, total: tt.total });
    recovery.complete();
    state.cart = [];
    ls.set(K.cart, state.cart);
    state.discount = "";
    ls.del(K.discount);
    // keep contact details for convenience, but the next checkout gets a new reference
    state.checkout = { firstName: c.firstName, lastName: c.lastName, email: c.email, country: c.country, phoneLocal: c.phoneLocal };
    ls.set(K.checkout, state.checkout);
    location.hash = "#/thank-you";
  }

  function setLang(lang) {
    if (lang === state.lang) return;
    const form = $("#contact-form");
    if (form) state.draft = readContactForm(form);
    state.lang = lang;
    ls.set(K.lang, lang);
    render();
    if (document.body.classList.contains("cart-open")) renderDrawer();
    if (state.recovery.status === "armed") recovery.arm(); // the call follows the new language
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("button, a, [data-close-cart]");
    if (!el) return;

    if (el.hasAttribute("data-lang")) { setLang(el.getAttribute("data-lang")); return; }
    if (el.hasAttribute("data-add")) {
      const p = PRODUCTS[el.getAttribute("data-add")];
      addToCart(p.id, 1);
      toast(t("added") + " · " + name(p));
      return;
    }
    if (el.hasAttribute("data-add-page")) {
      const p = PRODUCTS[el.getAttribute("data-add-page")];
      addToCart(p.id, state.pageQty);
      toast(t("added") + " · " + name(p));
      return;
    }
    if (el.hasAttribute("data-page-qty")) {
      state.pageQty = Math.max(1, Math.min(20, state.pageQty + parseInt(el.getAttribute("data-page-qty"), 10)));
      const out = $("#page-qty");
      if (out) out.textContent = state.pageQty;
      return;
    }
    if (el.hasAttribute("data-qty")) {
      const id = el.getAttribute("data-qty");
      const line = state.cart.find((l) => l.id === id);
      if (line) setQty(id, line.qty + parseInt(el.getAttribute("data-delta"), 10));
      return;
    }
    if (el.hasAttribute("data-remove")) { setQty(el.getAttribute("data-remove"), 0); return; }
    if (el.hasAttribute("data-open-cart")) { e.preventDefault(); if (route().a === "checkout") location.hash = "#/"; openCart(); return; }
    if (el.hasAttribute("data-close-cart")) { closeCart(); return; }
    if (el.hasAttribute("data-complete-order")) { completeOrder(); return; }

    const demo = el.getAttribute("data-demo");
    if (demo === "call") recovery.fire();
    else if (demo === "cancel") recovery.cancel();
    else if (demo === "reset") resetDemo();
    else if (demo === "min" || demo === "open") { state.panel = demo; ls.set(K.panel, demo); renderPanel(); }
  });

  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (form.id === "contact-form") { e.preventDefault(); submitContact(form); return; }
    if (form.hasAttribute("data-discount-form")) {
      e.preventDefault();
      const code = String(new FormData(form).get("code") || "").trim().toUpperCase();
      if (code === String(CFG.discountCode).toUpperCase()) {
        state.discount = CFG.discountCode;
        ls.set(K.discount, state.discount);
        if ($("#contact-form")) state.draft = readContactForm($("#contact-form"));
        render();
      } else {
        const msg = form.querySelector("[data-discount-msg]");
        if (msg) { msg.textContent = code ? t("code_invalid") : ""; msg.className = "discount-msg bad"; }
      }
    }
  });

  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.hasAttribute("data-demo-delay")) {
      ls.set(K.delay, parseInt(el.value, 10));
      if (state.recovery.status === "armed") recovery.arm(); // restart with the new delay
      else renderPanel();
    }
    if (el.hasAttribute("data-demo-passcode")) ls.set(K.passcode, el.value.trim());
    if (el.form && el.form.id === "contact-form") liveCapture(el.form);
  });

  document.addEventListener("input", (e) => {
    // clear an error as soon as the shopper fixes the field
    const wrap = e.target.closest(".invalid");
    if (wrap) {
      wrap.classList.remove("invalid");
      const out = wrap.querySelector("[data-error]");
      if (out) out.textContent = "";
    }
    if (e.target.name === "consent") {
      const out = document.querySelector("[data-consent-error]");
      if (out) out.textContent = "";
    }
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
  window.addEventListener("hashchange", () => { closeCart(); render(); });
  window.addEventListener("pagehide", () => recovery.onPageHide());
  window.addEventListener("storage", (e) => {
    // keep several open tabs of the store in sync
    if (e.key === K.recovery) { state.recovery = ls.get(K.recovery, { status: "idle" }); renderPanel(); }
    if (e.key === K.cart) { state.cart = sanitizeCart(ls.get(K.cart, [])); renderCartBits(); }
  });

  setInterval(() => recovery.tick(), 250);
  document.addEventListener("visibilitychange", () => recovery.tick());

  render();
  recovery.onLoad();
})();

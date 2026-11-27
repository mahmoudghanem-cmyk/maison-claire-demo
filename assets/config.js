/*
 * Store configuration. This is the only file you need to edit for a demo.
 *
 * callEndpoint: the URL of your Cloudflare Worker (see worker/aircall-call-trigger.js).
 *   Leave it empty to run in DRY RUN mode: the store shows the payload it
 *   would send instead of requesting a real call.
 *
 * Never put Aircall API credentials in this file. It is public.
 */
window.STORE_CONFIG = {
  storeName: "Maison Claire",

  // Cart recovery call
  callEndpoint: "https://cart-recovery-call.maison-claire-demo.workers.dev",
  abandonDelaySeconds: 15,     // override per visit with ?delay=10 (the Worker runs the timer,
                               // so the call happens even if the shopper closes the tab)

  // Offer the voice agent can make (keep it identical in the agent prompt)
  discountCode: "MERCI10",
  discountPercent: 10,

  // One language for the whole demo: "fr" or "en". The EN/FR switch disappears and the call
  // and the presenter guide stay in that language, whichever country code the visitor picks.
  // Leave it empty ("") to bring the EN/FR switch back.
  fixedLanguage: "fr",

  // Pricing (all prices are whole euros so the agent can say them cleanly)
  currency: "EUR",
  freeShippingThreshold: 50,
  shippingFee: 5,

  // Presenter panel in the bottom left corner. Off for the QR code stand (visitors use their
  // own phones); show it for one visit with ?demo=1
  showDemoPanel: false,

  // Event stand: each visitor's details are forgotten on this device after an order or
  // Reset, the checkout shows a "details are saved" notice.
  boothMode: true,
  boothCompany: "Aircall",

  // Consent and follow-up checkboxes at checkout. Off for the stand: the notice under the
  // phone field says the visitor will be called. Set to true to bring both boxes back.
  askConsent: false
};

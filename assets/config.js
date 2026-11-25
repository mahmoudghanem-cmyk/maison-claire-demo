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
  abandonDelaySeconds: 30,     // override per visit with ?delay=10 (the Worker runs the timer,
                               // so the call happens even if the shopper closes the tab)

  // Offer the voice agent can make (keep it identical in the agent prompt)
  discountCode: "MERCI10",
  discountPercent: 10,

  // Pricing (all prices are whole euros so the agent can say them cleanly)
  currency: "EUR",
  freeShippingThreshold: 50,
  shippingFee: 5,

  // Presenter panel in the bottom left corner. Hide per visit with ?demo=0
  showDemoPanel: true
};

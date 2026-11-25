# Maison Claire: cart recovery voice agent demo

A clean, Shopify-style demo storefront (English / French) that triggers an **Aircall AI Voice Agent outbound call** when a shopper abandons their checkout.

```
 Shopper on the store (GitHub Pages)
   │  1. adds products, goes to checkout
   │  2. enters first name + mobile + ticks "you may call me" → Continue to payment
   │  3. does not pay within 30 s  (= abandoned checkout)
   ▼
 POST cart (JSON)  ──►  Cloudflare Worker  (holds the Aircall API key, allowlist, passcode)
                              │
                              ▼
            POST https://api.aircall.io/v1/outbound-calls/agents/{AGENT_ID_EN | AGENT_ID_FR}
                              │
                              ▼
               Aircall AI Voice Agent calls the shopper, in the language they shopped in
```

Completing the order before the timer ends cancels the call, just as a real recovery flow would.

## What's in the repo

| Path | What it is |
| --- | --- |
| `index.html`, `assets/` | The store: static HTML, CSS and JS with no build step. |
| `assets/config.js` | **The only file you edit**: Worker URL, delay, discount code. |
| `assets/catalog.js` | The 8 products with EN/FR names, descriptions and spoken forms. |
| `worker/aircall-call-trigger.js` | Cloudflare Worker that calls the Aircall API. |
| `docs/agent-brief.md` | Agent setup: prompt, first message, voicemail and knowledge base, in EN and FR. |

## The products

Eight everyday home items. Each has **one variant** (no sizes or colours), a **plain noun that translates one to one**, and a **whole-euro price**. That leaves the agent nothing ambiguous to clarify in either language.

| EN | FR | Price |
| --- | --- | --- |
| Ceramic Mug | Tasse en céramique | 18 € |
| Vanilla Scented Candle | Bougie parfumée à la vanille | 24 € |
| Wool Blanket | Plaid en laine | 79 € |
| Insulated Bottle | Gourde isotherme | 29 € |
| Cotton Tote Bag | Sac cabas en coton | 15 € |
| Paper Notebook | Carnet de notes | 12 € |
| Cotton Bath Towel | Serviette de bain en coton | 25 € |
| Table Lamp | Lampe de table | 69 € |

Free shipping from 50 € (otherwise 5 €), free returns within 30 days, and the recovery code **MERCI10** (10 % off), which is easy to say in both languages.

## Run it locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. With no `callEndpoint` set, the store runs in **dry run**: the demo panel (bottom left) shows the exact payload it would send.

## Setup, step by step

### 1. Publish the store on GitHub Pages

1. Push this folder to a GitHub repository. A public repository is required for Pages on a free plan.
2. Go to **Settings → Pages → Build and deployment**, set Source to **Deploy from a branch**, choose `main` and `/ (root)`, then **Save**.
3. After about a minute the store is live at `https://<your-user>.github.io/<repo>/`.

### 2. Create the Aircall outbound agent(s)

Follow [docs/agent-brief.md](docs/agent-brief.md). You need:
- one outbound agent per language (or a single one),
- a **phone number assigned** to each agent,
- the agent ID(s), from the agent's URL or its trigger endpoint in the Dashboard,
- an Aircall **API ID and API token** (Dashboard → Integrations & API → API keys).

### 3. Deploy the Worker (5 minutes, no CLI needed)

1. Go to https://dash.cloudflare.com → **Workers & Pages → Create → Create Worker**. Name it `cart-recovery-call`, then **Deploy**.
2. Click **Edit code**, replace everything with the contents of `worker/aircall-call-trigger.js`, then **Deploy**.
3. Under **Settings → Variables and Secrets**, add:

| Name | Type | Example |
| --- | --- | --- |
| `AIRCALL_API_ID` | Secret | your API ID |
| `AIRCALL_API_TOKEN` | Secret | your API token |
| `AGENT_ID_EN` | Text | English outbound agent ID |
| `AGENT_ID_FR` | Text | French outbound agent ID |
| `ALLOWED_ORIGINS` | Text | `https://<your-user>.github.io` (origin only, no path) |
| `ALLOWED_NUMBERS` | Text | `+33612345678,+447700900123`: the phones you'll demo with |
| `DEMO_PASSCODE` | Secret (optional) | any string |
| `DRY_RUN` | Text (optional) | `true` while testing, then delete it |

Optional: `ALLOWED_PHONE_PREFIXES` (for example `+33,+44`, to let prospects type their own number), `AIRCALL_API_BASE` (default `https://api.aircall.io`), `EXPIRATION_SECONDS` (default 300), `MAX_CALLS_PER_NUMBER_PER_HOUR` (default 6).

4. Open the Worker URL in a browser. You should see `{"ok":true,"service":"cart-recovery-call",...}`.

### 4. Connect the store to the Worker

In `assets/config.js`, set:

```js
callEndpoint: "https://cart-recovery-call.<your-subdomain>.workers.dev",
```

Also bump the `?v=1` on the `config.js` script tag in `index.html` (to `?v=2`, and so on). GitHub Pages caches files for about 10 minutes, so without the bump the old config can keep loading. Commit and push. The demo panel badge switches from **Dry run** to **Live**. If it doesn't, hard-refresh with Cmd+Shift+R.

**First live call = verification.** Before demoing to anyone, do one call to your own allow-listed number with `DRY_RUN` removed. If Aircall answers 400 or 422, remove the `contact_name` line from the Worker first (the other fields match the Aircall-verified HubSpot trigger payload).

If you set `DEMO_PASSCODE`, open the store once with `?passcode=<your passcode>`. It is saved in that browser and removed from the URL. You can also type it in the demo panel.

## Running the demo

1. Open the store and pick **EN** or **FR** in the header. The call uses the language the shopper used.
2. Add a couple of products and click **Check out**.
3. Enter a first name and an allow-listed mobile number, tick the call consent box, then click **Continue to payment**.
4. Stop. The demo panel counts down from 30 s and then shows **Call requested**. Your phone rings.
5. Talk to the agent (see the question ideas in the agent brief). Then go back, apply **MERCI10** and complete the order.
6. Click **Reset demo** in the panel before the next run.

**Per-visit URL options**

| Option | Effect |
| --- | --- |
| `?delay=10` | Countdown in seconds (3 to 3600). Also adjustable in the panel. |
| `?lang=fr` | Open the store in French. |
| `?demo=0` | Hide the presenter panel (for a "real customer" look). `?demo=1` brings it back. |
| `?passcode=xxxx` | Save the Worker passcode in this browser. |

The panel also has **Call now**, which skips the countdown. It's a reliable fallback during a live demo, and it can ring again after an earlier attempt.

> **Keep the tab open.** The 30 s timer runs in the browser, so closing the tab does not trigger the call: a reload can't be told apart from a close. To "abandon", just stop on the payment page or switch to another tab. To also call when the tab is closed, set `callOnTabClose: true` in `config.js`. The call is then requested immediately on close, but reloading the page on the payment step will call too.

## Troubleshooting

| Panel message | Fix |
| --- | --- |
| `origin_not_allowed` | Add the exact site origin to `ALLOWED_ORIGINS`, e.g. `https://you.github.io` |
| `phone_not_allowed` | Add the number to `ALLOWED_NUMBERS` or its prefix to `ALLOWED_PHONE_PREFIXES` |
| `invalid_passcode` | Open the store with `?passcode=...` or type it in the panel |
| `Conflict (...no phone number is assigned...)` | Aircall 409: assign a number to the outbound agent in the Dashboard |
| `Unauthorized` | Aircall 401: check `AIRCALL_API_ID` / `AIRCALL_API_TOKEN` |
| `Agent not found` | Check the agent IDs and `AIRCALL_API_BASE` |
| `aircall_rejected` | Aircall refused the call (eligibility, or a restricted number). See `aircall_response` in the browser network tab. |
| `Failed to fetch` | Wrong `callEndpoint` URL, or the Worker isn't deployed |
| Panel says "Worker reached, but it is in DRY_RUN mode" | Remove `DRY_RUN` from the Worker variables |

Worker logs: Cloudflare dashboard → your Worker → **Logs** (live tail).

## Safety and compliance

- **Aircall credentials never reach the browser.** They live only in Worker secrets.
- The Worker **refuses to dial** any number not on `ALLOWED_NUMBERS` / `ALLOWED_PHONE_PREFIXES`, so the public page can't be used to call strangers. Keep the allowlist tight.
- Every call uses a unique `idempotency_key` per checkout, so a retry never double-dials.
- The checkout asks for **explicit consent** to be called. Keep that in any real version.
- **France:** French mobile (06, 07) and geographic (01 to 05, 09) numbers can't be used as the AI agent's outbound number (NPV only). Check your from-number before demoing to French numbers.
- The store is a demo: no real payment fields, no orders, `noindex`.

## No-code alternative

Instead of the Worker, you can point `callEndpoint` at a Make, Zapier or n8n webhook that calls the same Aircall endpoint with Basic auth. The store sends `text/plain` JSON with `phone`, `lang`, `attempt_id` and a `context` object. Map them to `contact_phone`, the agent ID, `idempotency_key` and `context`. You lose the allowlist and passcode checks unless you rebuild them as filters, so the Worker is recommended.

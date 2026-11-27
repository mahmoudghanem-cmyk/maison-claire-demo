# Maison Claire: cart recovery voice agent demo

A clean, Shopify-style demo storefront (English / French) that triggers an **Aircall AI Voice Agent outbound call** when a shopper abandons their checkout.

```
 Shopper on the store (GitHub Pages)
   │  1. adds products, goes to checkout
   │  2. enters first name + mobile + ticks "you may call me"
   │     → the store sends the cart to the Worker right away ("arm")
   ▼
 Cloudflare Worker  (holds the Aircall API key, allowlist, passcode)
   │  starts a 15 s timer on the server (a Durable Object alarm), one per checkout
   │  any change to the cart or language restarts the timer; paying cancels it
   ▼
 timer ends, no order  (= abandoned checkout, even if the tab was closed)
   │
   ▼
 POST https://api.aircall.io/v1/outbound-calls/agents/{AGENT_ID}
   │
   ▼
 Aircall AI Voice Agent calls the shopper, in the language they shopped in
```

The timer runs on the server, so the call happens even if the shopper closes the tab or switches off their laptop. Completing the order before the timer ends cancels the call, just as a real recovery flow would.

## What's in the repo

| Path | What it is |
| --- | --- |
| `index.html`, `assets/` | The store: static HTML, CSS and JS with no build step. |
| `assets/config.js` | **The only file you edit**: Worker URL, delay, discount code. |
| `assets/catalog.js` | The 8 products with EN/FR names, descriptions and spoken forms. |
| `assets/guide.js`, `assets/guide.css` | The optional presenter guide (see [Presenter guide](#presenter-guide)). Only loaded with `?guide=1`. |
| `worker/aircall-call-trigger.js` | Cloudflare Worker: runs the abandonment timer and calls the Aircall API. |
| `worker/wrangler.toml` | Worker settings (public values only; secrets are set with `wrangler secret put`). |
| `docs/agent-brief.md` | Agent setup: prompt, first message, voicemail and knowledge base, in EN and FR. |

## The products

Six everyday home items with **one variant** each, and two furniture pieces with **options** (wood and size, fabric and legs) for harder product questions: materials, dimensions, weights, lead times. Every price is a **whole number of euros**, and each name is a plain noun with a direct translation. The agent's cart sentence names the chosen version ("one 220 centimetre dining table in solid walnut"). Furniture facts for the agent are in [docs/kb-furniture.md](docs/kb-furniture.md).

| EN | FR | Price |
| --- | --- | --- |
| Ceramic Mug | Tasse en céramique | 18 € |
| Vanilla Scented Candle | Bougie parfumée à la vanille | 24 € |
| Wool Blanket | Plaid en laine | 79 € |
| Insulated Bottle | Gourde isotherme | 29 € |
| Solid Wood Dining Table (natural oak, smoked oak or walnut; 180 or 220 cm) | Table à manger en bois massif | 1,890 to 2,790 € |
| Lounge Armchair (3 velvets or ivory bouclé; natural or black oak legs) | Fauteuil de salon | 1,290 or 1,390 € |
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

### 3. Deploy the Worker (command line, about 5 minutes)

The Worker uses a Durable Object (a small server-side timer per checkout), so deploy it with Wrangler, Cloudflare's CLI, rather than pasting code in the dashboard. A free Cloudflare account is enough.

```bash
cd worker
npx wrangler login          # opens the browser once to authorise Wrangler
npx wrangler deploy         # prints https://cart-recovery-call.<your-subdomain>.workers.dev
```

Then set the secrets. Each command asks for the value in a hidden prompt, so nothing ends up in the repository or your shell history:

```bash
npx wrangler secret put AIRCALL_API_ID
npx wrangler secret put AIRCALL_API_TOKEN
npx wrangler secret put AGENT_ID            # or AGENT_ID_EN and AGENT_ID_FR for one agent per language
npx wrangler secret put DEMO_PASSCODE       # shared code the stand's device sends (required for booth mode)
npx wrangler secret put LEADS_ADMIN_KEY     # password to download the visitor list
npx wrangler secret put DRY_RUN             # type true while testing; delete it later to go live
```

| Name | Where | What |
| --- | --- | --- |
| `AIRCALL_API_ID`, `AIRCALL_API_TOKEN` | secret | Aircall API key pair |
| `AGENT_ID` (or `AGENT_ID_EN` / `AGENT_ID_FR`) | secret | Outbound agent ID(s) |
| `ALLOWED_PHONE_PREFIXES` | `wrangler.toml` | Countries visitors may enter, set Europe-wide: `+33,+44,+32,+41,+34,+49,+39,+31,+353,+352`. Requires `DEMO_PASSCODE`. |
| `ALLOWED_NUMBERS` | secret (optional) | Extra exact E.164 numbers, or the only ones if you remove the prefixes |
| `DEMO_PASSCODE` | secret | Shared code the store must send. Without it, booth mode refuses every call. |
| `LEADS_ADMIN_KEY` | secret | Password for the visitor list download |
| `MAX_CALLS_PER_HOUR` | `wrangler.toml` | Cap on all calls together, 60 by default |
| `DRY_RUN` | secret (optional) | `true`: build the Aircall request but don't call |
| `ALLOWED_ORIGINS` | `wrangler.toml` | Store origins, e.g. `https://<your-user>.github.io` (origin only, no path) |
| `ABANDON_DELAY_SECONDS` | `wrangler.toml` | Default timer, 30 |
| `EXPIRATION_SECONDS`, `MAX_CALLS_PER_NUMBER_PER_HOUR` | `wrangler.toml` | 300 and 6 by default |

Open the Worker URL in a browser. You should see `{"ok":true,"service":"cart-recovery-call","dry_run":true,"server_timer":true}`. Live logs: `npx wrangler tail`.

To remove dry run later: `npx wrangler secret delete DRY_RUN`.

### 4. Connect the store to the Worker

In `assets/config.js`, set:

```js
callEndpoint: "https://cart-recovery-call.<your-subdomain>.workers.dev",
```

Also bump the `?v=` on the script tags in `index.html` (for example `?v=2` to `?v=3`). GitHub Pages caches files for about 10 minutes, so without the bump the old config can keep loading. Commit and push. The demo panel badge switches from **Dry run** to **Live**. If it doesn't, hard-refresh with Cmd+Shift+R.

**First live call = verification.** Before demoing to anyone, do one call to your own allow-listed number with `DRY_RUN` removed. If Aircall answers 400 or 422, remove the `contact_name` line from the Worker first (the other fields match the Aircall-verified HubSpot trigger payload).

If you set `DEMO_PASSCODE`, open the store once with `?passcode=<your passcode>`. It is saved in that browser and removed from the URL. You can also type it in the demo panel.

## Running the demo

1. Open the store. At the moment it is **French only** (`fixedLanguage: "fr"` in `assets/config.js`): there is no EN/FR switch, and the call is in French whichever country code the visitor picks. Set `fixedLanguage: ""` to bring the **EN** / **FR** switch back; the call then uses the language the shopper used.
2. Add a couple of products and click **Check out**.
3. Enter a first name and an allow-listed mobile number (and tick the consent box if `askConsent` is on). The timer starts on the server as soon as they are filled in; **Continue to payment** is optional.
4. Stop, or close the tab. After 15 s (the demo panel, if shown, counts down and then shows **Call requested**) your phone rings.
5. Talk to the agent (see the question ideas in the agent brief). The French agent also asks for a delivery postal code (saved with the call in Aircall, not in the visitor list), and transfers the call only if you ask for a person. Then go back, apply **MERCI10** and complete the order.
6. Click **Reset demo** in the panel before the next run (on a shared device).

**Per-visit URL options**

| Option | Effect |
| --- | --- |
| `?delay=10` | Countdown in seconds (5 to 3600). Also adjustable in the panel. |
| `?lang=fr` | Open the store in French (ignored while `fixedLanguage` is set). |
| `?demo=1` | Show the presenter panel (off by default: `showDemoPanel: false`). `?demo=0` hides it when it is on. |
| `?passcode=xxxx` | Save the Worker passcode in this browser. |

The panel also has **Call now**, which skips the countdown. It's a reliable fallback during a live demo, and it can ring again after an earlier attempt.

> **Closing the tab still calls.** The timer lives in the Worker, not in the browser. Editing the cart or switching language restarts it, completing the order (or unticking consent, when shown) cancels it, and each checkout gets at most one automatic call (**Call now** can ring again).

## At an event stand

Visitors scan a QR code with their own phone, fill in their name, number and cart, and get called by the agent about 15 seconds later: they live the experience as the customer. The current `config.js` is set up for this: no presenter panel (`showDemoPanel: false`), no checkboxes (`askConsent: false`, the notice under the phone field says they will be called), 15 s delay.

- **QR code URL:** the bare store link. `REQUIRE_PASSCODE = "false"` in `wrangler.toml` lets calls through without a passcode, so anyone with the link can trigger calls, limited to the countries in `ALLOWED_PHONE_PREFIXES` and to `MAX_CALLS_PER_NUMBER_PER_HOUR` / `MAX_CALLS_PER_HOUR`. After the event, set it back to `"true"` and redeploy: the site then needs `?passcode=<DEMO_PASSCODE>` again.
- **Make the QR code** with `python3 tools/make-qr.py` (no install; writes `qr-store.png` and `.svg`). Options: `--lang fr`, and `--ask-passcode` (hidden prompt) when the passcode is back on. QR images are gitignored.
- **On a shared tablet instead**, open the same URL with `&demo=1` to get the panel and its **Reset demo** button between visitors. With `boothMode: true`, completing the order or resetting makes the device forget the visitor's details.
- **Visitor list**: open `https://cart-recovery-call.<your-subdomain>.workers.dev/leads.csv`, enter any user name and `LEADS_ADMIN_KEY` as the password. You get a CSV (opens in Excel or Google Sheets) with time, name, phone, email, language, cart, call outcome, whether they bought, and whether they ticked the optional follow-up box (always `false` while `askConsent` is off). Only numbers that passed the passcode and country checks are saved.
- **Erase the list** after the event: `curl -u admin:<LEADS_ADMIN_KEY> -X DELETE https://cart-recovery-call.<your-subdomain>.workers.dev/leads`
- **Privacy:** the checkout tells visitors they will be called and that their details are saved. With the checkboxes off there is no follow-up opt-in, so don't use the list for marketing without another basis (e.g. a badge scan). Check the wording with your privacy team before the event.

## Presenter guide

An optional side panel for the **person demoing on a laptop**. It tells you what to click next, helps fill in the checkout, and shows what happens behind the scenes. It is off by default: the QR code stand never loads it.

| URL | Effect |
| --- | --- |
| `?guide=1` | Turn the guide on for this browser tab (it stays on while you browse the store in that tab). |
| `?guide=1&sim=1` | **Rehearsal.** The whole flow runs, but nothing is sent to the Worker or Aircall: no call is placed. Use it to practise. |
| `?guide=1&sim=0` | Force live calls again after a rehearsal. |
| `?guide=0` | Turn the guide off, end any rehearsal and forget the timeline. |

The panel is in the store's language, so with `fixedLanguage: "fr"` it stays in French. With the switch back on (`fixedLanguage: ""`), it follows the store's EN/FR switch, and `&lang=fr` opens it in French.

**What you see** (right-hand panel, about 400 px wide; use the arrow to collapse it to a slim tab):

- **Step bar and "do this now" card.** Five steps: add a product, check out, fill in the details, wait for the countdown, recover the order. The card says what to do and why, and a highlight points at the real button or field on the store. The step is worked out from what the store is doing, so it stays right if you go back or reload.
- **Checkout helper.** A checklist of the fields still to fill, a masked preview of the number as the Worker will receive it (for example `+33 6••••••78`), and an **Apply code** button for the discount.
- **Backstage timeline.** Five events, filled in as they happen: checkout captured, timer armed, what Emma knows (with her opening line), call requested (with the exact details she is sent, personal values masked), order recovered.
- **Presenter controls** (folded away by default): **Call now** skips the countdown, **Cancel**, **Reset** for the next run, the countdown length, and a **Talking points** switch for short lines to say out loud.

**Good to know**

- The countdown is **20 s** in guide mode, so there is time to narrate. The stand stays at 15 s. Change it in Presenter controls or with `?delay=`.
- The timeline shows what the store and the Worker report: armed, calling, sent, error, converted, cancelled. It does not show whether the visitor *answered* or how the call went, because the Worker has no Aircall call events. Check that in the Aircall dashboard.
- Emma's opening line in the timeline is typed into `assets/guide.js` (`ev_opening`, EN and FR), copied from section 3 of [`docs/agent-brief.md`](docs/agent-brief.md). **If you change the first message in the Aircall dashboard, change it there too.**
- **Don't tell anyone to complete the order before the call.** That cancels the call, exactly like a real recovery flow. Let the call come first, then complete the order.
- Only the laptop layout is designed: the panel docks beside the store from about 1100 px wide and overlays it below that. On a phone it starts collapsed and is not meant for visitors.
- `?sim=1` also works without `?guide=1`. `?guide=0` clears it.
- After editing `guide.js` or `guide.css`, bump the `?v=` in `index.html` like the other files. `guide.css`'s version sits inside the small script in `<head>`, and `guide.js` takes its version from the `app.js` tag, so bump all the `?v=` together.
- `guide.js` and `guide.css` are new files: add them to git (`git add assets/guide.js assets/guide.css`) along with the edits to `index.html` and `assets/app.js`.

**Before using it live:** do one rehearsal (`?guide=1&sim=1`), then one real call to your own number to check the timeline against what you hear and see in the Aircall dashboard. For that call:

1. Serve the store from your computer with `python3 -m http.server 8080` and open `http://localhost:8080/?guide=1&sim=0` (the Worker accepts `localhost:8080`; GitHub Pages only has the guide once this branch is merged and pushed).
2. Check that `DRY_RUN` is off on the Worker (`npx wrangler secret delete DRY_RUN`), otherwise nothing rings and the guide says the Worker is in dry run.
3. Use a number inside `ALLOWED_PHONE_PREFIXES`, and make sure the **country dropdown** in the checkout matches it (it starts on +33 France in both languages; a number typed without its country code is read as belonging to the selected country). The masked preview in the panel shows the number the Worker will receive.
4. If `REQUIRE_PASSCODE` is `"true"` on the Worker, add `&passcode=<DEMO_PASSCODE>` once.
5. Finish with `?guide=0`.

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
| Panel says "Worker reached, but it is in DRY_RUN mode" | `npx wrangler secret delete DRY_RUN` from `worker/` |

Worker logs: `npx wrangler tail` from `worker/`, or Cloudflare dashboard → your Worker → **Logs**.

## Safety and compliance

- **Aircall credentials never reach the browser.** They live only in Worker secrets.
- The Worker **refuses to dial** any number not on `ALLOWED_NUMBERS` / `ALLOWED_PHONE_PREFIXES`, so the public page can't be used to call strangers. Keep the allowlist tight.
- Every call uses a unique `idempotency_key` per checkout, so a retry never double-dials.
- Turn `askConsent` back on for anything other than a stand where visitors call themselves: a real store needs **explicit consent** to be called.
- **France:** French mobile (06, 07) and geographic (01 to 05, 09) numbers can't be used as the AI agent's outbound number (NPV only). Check your from-number before demoing to French numbers.
- The store is a demo: no real payment fields, no orders, `noindex`.

## No-code alternative

A Make, Zapier or n8n webhook can stand in for the Worker, but it has to play the Worker's part. The store sends `text/plain` JSON with an `action` (`arm`, `cancel`, `complete` or `call_now`), `attempt_id`, `phone`, `lang`, `delay_seconds` and a `context` object. The scenario must wait `delay_seconds` after the latest `arm` for that `attempt_id`, skip the call if a `cancel` or `complete` came in meanwhile, then call the Aircall endpoint with Basic auth (`contact_phone`, `idempotency_key` = `cart-recovery-<attempt_id>`, `context`). The panel's live status also needs `GET /status?id=<attempt_id>`. That is a lot to rebuild, along with the allowlist and passcode checks, so the Worker is recommended.

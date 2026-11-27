/*
 * Presenter guide: the docked panel (milestone 1) and the step coach with its spotlight (milestone 2).
 *
 * Loaded by app.js only when the page was opened with ?guide=1 (see index.html). It reads the store
 * through window.MC_GUIDE (masked values only) and re-renders on "mc:change" events. It never owns
 * the flow: the current step is worked out from the store's own state (cart, page, call status), so
 * the back button, a language switch or an edited cart can never leave it stuck.
 *
 * Later milestones add the behind-the-scenes timeline.
 */
(function () {
  "use strict";

  const API = window.MC_GUIDE;
  if (!API || document.getElementById("gd-panel")) return;

  const STR = {
    en: {
      aria_panel: "Presenter guide",
      eyebrow: "Behind the scenes",
      title: "Cart recovery, handled by an AI Voice Agent",
      hide: "Hide guide",
      show: "Show guide",
      mode_live: "Live",
      mode_rehearsal: "Rehearsal · no call",
      mode_dry: "Dry run",
      steps: "Steps",
      s1: "Add",
      s2: "Check out",
      s3: "Details",
      s4: "Wait",
      s5: "Recover",
      step_of: "Step {n} of 5",
      lbl_done: "Finished",
      lbl_error: "Something went wrong",
      lbl_cancelled: "Cancelled",
      say: "Say",

      c1_do: "Add something to your cart",
      c1_why: "Pick one or two items. The dining table and the armchair give Emma more to talk about.",
      c1_say: "A shopper browses the store and picks a few things.",
      c2_do: "Open your cart and check out",
      c2_why: "This is the moment a shopper heads for the checkout.",
      c2_say: "They are serious about buying: they are about to pay.",
      c3_do: "Enter your details",
      c3_why: "A first name and a mobile you can answer in the next minute. Emma will call that number.",
      c3_say: "In a real store, this is where the checkout is captured. The shopper has not paid yet.",
      chk_first: "First name",
      chk_first_todo: "Emma greets you by name.",
      chk_first_ok: "Emma will say “Hi {name}”.",
      chk_last: "Last name",
      chk_last_todo: "Optional. Emma already has it, so she won't ask.",
      chk_last_ok: "Saved with the call. Emma won't need to ask.",
      chk_phone: "Mobile number",
      chk_phone_todo: "A mobile that can pick up in the next minute.",
      chk_phone_bad: "That number looks incomplete.",
      chk_phone_ok: "Emma will call {phone}, {lang}.",
      in_en: "in English",
      in_fr: "in French",
      c3_go: "All set. Click outside the field, or press Tab, to start the timer.",
      c4_do: "Stop here. Don't complete the order.",
      c4_why: "Your cart now counts as abandoned. Emma calls when the timer ends, even if you close this tab.",
      c4_say: "The timer runs on a server, not in this browser. Change the cart and it restarts.",
      c4_sending_do: "Requesting the call…",
      c4_sending_why: "Your phone should ring in a moment.",
      c4_restart: "The timer restarted because something changed: the cart, the language or the details.",
      c5_do: "Your phone should ring now. Pick up!",
      c5_why: "Talk to Emma. Afterwards, apply the code and complete the order.",
      c5_dry_do: "Rehearsal: the phone would ring now",
      c5_dry_why: "No call was placed. Carry on: apply the code and complete the order.",
      c5_say: "Emma knows the cart and offers a discount code. The shopper comes back and buys.",
      c5_apply: "Apply {code}",
      c5b_do: "Code applied. Complete the order",
      c5b_why: "Continue to payment, then complete the order to finish the recovery.",
      done_do: "Order recovered",
      done_why: "A cart was abandoned, Emma called, and the order was saved. That is the whole flow.",
      done_dry_why: "Rehearsal: no call was placed. In a live demo, Emma calls after the timer and the order is saved.",
      done_nocall_do: "Order completed before the timer",
      done_nocall_why: "No call was needed. Had the shopper left, Emma would have called.",
      done_say: "Walk through what Emma did: she knew the cart and offered the code.",
      again: "Run another demo",
      cancel_do: "Call cancelled",
      cancel_why: "The timer was cancelled, so no call will be made.",
      err_do: "The call could not be placed",
      err_why: "The details are in Presenter controls. Try again when you are ready.",
      err_arm_do: "The timer could not start",
      err_arm_why: "The server did not accept the details, so no call is scheduled. Check the connection, then try again.",
      err_detail: "Detail: {msg}",
      retry: "Try again",

      b_add: "Add to cart",
      b_options: "Choose options",
      b_browse: "Browse the collection",
      b_cart: "Open cart",
      b_checkout: "Check out",
      b_first: "First name",
      b_last: "Last name",
      b_phone: "Mobile phone",
      b_tab: "Click outside or Tab",
      b_not_yet: "Not yet",
      b_code: "Discount code",
      b_continue: "Continue",
      b_complete: "Complete order",

      k_page: "Page",
      k_cart: "Cart",
      k_call: "Call",
      k_who: "Shopper",
      controls: "Presenter controls",
      call_now: "Call now",
      cancel: "Cancel",
      reset: "Reset",
      delay: "Countdown",
      notes: "Talking points",
      sec: "{n} s",
      need_contact: "Fill in the checkout details first.",
      foot: "Powered by Aircall AI Voice Agent",
      p_home: "Home",
      p_product: "Product",
      p_info: "Checkout · details",
      p_payment: "Checkout · payment",
      p_thanks: "Thank you",
      cart_empty: "Empty",
      cart_n: "{n} item(s)",
      st_idle: "Waiting for details",
      st_armed: "Timer running · {s} s",
      st_sending: "Requesting the call…",
      st_sent: "Call requested",
      st_sent_dry: "Worker dry run: no call placed",
      st_dry: "No call placed (dry run)",
      st_dry_rehearsal: "No call placed (rehearsal)",
      st_error: "Request failed",
      st_converted: "Order completed, no call",
      st_cancelled: "Cancelled",
      k_event: "Event ID",
      sr_pending: "not yet",
      sr_active: "in progress",
      sr_done: "done",
      sr_sim: "simulated, rehearsal",
      sr_warn: "problem",
      sr_skip: "skipped",

      tl_title: "What happens behind the scenes",
      ev_captured: "Checkout captured",
      ev_captured_p: "Waiting for a first name and a mobile.",
      ev_captured_d: "Name, mobile and cart are saved. The shopper has not paid yet.",
      ev_armed: "Timer armed",
      ev_armed_p: "Starts as soon as the details are saved.",
      ev_armed_live: "Running on the server, so it keeps going even if this tab closes. {s} s left. It restarts if the cart, language or details change.",
      ev_armed_local: "Running in this browser (rehearsal, no server). {s} s left.",
      ev_armed_done: "The timer is over.",
      ev_armed_skipped: "Skipped: Call now was pressed before the timer ended.",
      ev_armed_stopped: "Stopped before it ran out.",
      ev_armed_failed: "The timer could not be set: {msg}",
      ev_knows: "What Emma knows",
      ev_knows_p: "She is given the cart before she dials.",
      ev_knows_d: "{name} · {items} · {total}. She can offer the code {code}.",
      ev_open: "Her opening line",
      ev_opening: "Hi {name}, this is Emma from Maison Claire. I'm calling because you left a few things in your cart a moment ago. Do you have a minute?",
      ev_call: "Call requested",
      ev_call_p: "Sent to Aircall when the timer ends.",
      ev_call_active: "Asking Aircall to place the call…",
      ev_call_sent: "Aircall was asked to call {phone}.",
      ev_call_workerdry: "Worker dry run: Aircall was not asked, so no call was placed.",
      ev_call_rehearsal: "Rehearsal: nothing was sent. This is what would go to Aircall.",
      ev_call_failed: "The request failed: {msg}",
      ev_call_skipped: "No call was made.",
      ev_payload_sent: "What was sent",
      ev_payload_dry: "What would be sent",
      ev_rec: "Order recovered",
      ev_rec_p: "When the shopper comes back and completes the order.",
      ev_rec_d: "The shopper completed the order after the call.",
      ev_rec_plain: "The order was completed.",
      ev_rec_early: "Completed before the timer ended, so no call was needed.",
      ev_rec_cancelled: "Cancelled: no call and no order."
    },
    fr: {
      aria_panel: "Guide présentateur",
      eyebrow: "Dans les coulisses",
      title: "La relance panier, gérée par un agent vocal IA",
      hide: "Masquer le guide",
      show: "Afficher le guide",
      mode_live: "Réel",
      mode_rehearsal: "Répétition · aucun appel",
      mode_dry: "Mode test",
      steps: "Étapes",
      s1: "Ajouter",
      s2: "Commander",
      s3: "Infos",
      s4: "Patienter",
      s5: "Conclure",
      step_of: "Étape {n} sur 5",
      lbl_done: "Terminé",
      lbl_error: "Un problème est survenu",
      lbl_cancelled: "Annulé",
      say: "À dire",

      c1_do: "Ajoutez un article à votre panier",
      c1_why: "Choisissez un ou deux articles. La table à manger et le fauteuil donnent plus de matière à Emma.",
      c1_say: "Un client parcourt la boutique et choisit quelques articles.",
      c2_do: "Ouvrez votre panier et passez commande",
      c2_why: "C'est le moment où un client se dirige vers la caisse.",
      c2_say: "Il est sérieux : il s'apprête à payer.",
      c3_do: "Saisissez vos coordonnées",
      c3_why: "Un prénom et un mobile sur lequel vous pouvez répondre dans la minute. Emma appellera ce numéro.",
      c3_say: "Dans une vraie boutique, c'est ici que le panier est enregistré. Le client n'a pas encore payé.",
      chk_first: "Prénom",
      chk_first_todo: "Emma vous appelle par votre prénom.",
      chk_first_ok: "Emma dira « Bonjour {name} ».",
      chk_last: "Nom",
      chk_last_todo: "Facultatif. Emma l'a déjà, elle ne vous le demandera pas.",
      chk_last_ok: "Enregistré avec l'appel. Emma n'aura pas à le demander.",
      chk_phone: "Numéro de mobile",
      chk_phone_todo: "Un mobile qui peut décrocher dans la minute.",
      chk_phone_bad: "Ce numéro semble incomplet.",
      chk_phone_ok: "Emma appellera le {phone}, {lang}.",
      in_en: "en anglais",
      in_fr: "en français",
      c3_go: "Tout est prêt. Cliquez en dehors du champ, ou appuyez sur Tab, pour lancer le minuteur.",
      c4_do: "Arrêtez-vous ici. Ne validez pas la commande.",
      c4_why: "Votre panier est maintenant considéré comme abandonné. Emma appelle à la fin du minuteur, même si vous fermez cet onglet.",
      c4_say: "Le minuteur tourne sur un serveur, pas dans ce navigateur. Modifiez le panier et il repart.",
      c4_sending_do: "Demande d'appel en cours…",
      c4_sending_why: "Votre téléphone devrait sonner dans un instant.",
      c4_restart: "Le minuteur a redémarré car quelque chose a changé : le panier, la langue ou les coordonnées.",
      c5_do: "Votre téléphone devrait sonner. Décrochez !",
      c5_why: "Parlez à Emma. Ensuite, appliquez le code et validez la commande.",
      c5_dry_do: "Répétition : le téléphone sonnerait maintenant",
      c5_dry_why: "Aucun appel n'a été passé. Continuez : appliquez le code et validez la commande.",
      c5_say: "Emma connaît le panier et propose un code de réduction. Le client revient et achète.",
      c5_apply: "Appliquer {code}",
      c5b_do: "Code appliqué. Validez la commande",
      c5b_why: "Continuez vers le paiement, puis validez la commande pour terminer la relance.",
      done_do: "Commande récupérée",
      done_why: "Un panier a été abandonné, Emma a appelé, et la commande est sauvée. Voilà tout le parcours.",
      done_dry_why: "Répétition : aucun appel n'a été passé. En démo réelle, Emma appelle après le minuteur et la commande est sauvée.",
      done_nocall_do: "Commande validée avant la fin du minuteur",
      done_nocall_why: "Aucun appel n'était nécessaire. Si le client était parti, Emma aurait appelé.",
      done_say: "Racontez ce qu'Emma a fait : elle connaissait le panier et a proposé le code.",
      again: "Relancer une démo",
      cancel_do: "Appel annulé",
      cancel_why: "Le minuteur a été annulé : aucun appel ne sera passé.",
      err_do: "L'appel n'a pas pu être passé",
      err_why: "Les détails sont dans les commandes du présentateur. Réessayez quand vous voulez.",
      err_arm_do: "Le minuteur n'a pas pu démarrer",
      err_arm_why: "Le serveur n'a pas accepté les coordonnées : aucun appel n'est programmé. Vérifiez la connexion, puis réessayez.",
      err_detail: "Détail : {msg}",
      retry: "Réessayer",

      b_add: "Ajouter au panier",
      b_options: "Voir les options",
      b_browse: "Découvrir la collection",
      b_cart: "Ouvrir le panier",
      b_checkout: "Passer commande",
      b_first: "Prénom",
      b_last: "Nom",
      b_phone: "Téléphone mobile",
      b_tab: "Cliquez ailleurs ou Tab",
      b_not_yet: "Pas encore",
      b_code: "Code de réduction",
      b_continue: "Continuer",
      b_complete: "Valider la commande",

      k_page: "Page",
      k_cart: "Panier",
      k_call: "Appel",
      k_who: "Client",
      controls: "Commandes du présentateur",
      call_now: "Appeler",
      cancel: "Annuler",
      reset: "Réinitialiser",
      delay: "Compte à rebours",
      notes: "Points à dire",
      sec: "{n} s",
      need_contact: "Remplissez d'abord les coordonnées du checkout.",
      foot: "Propulsé par l'agent vocal IA d'Aircall",
      p_home: "Accueil",
      p_product: "Produit",
      p_info: "Commande · coordonnées",
      p_payment: "Commande · paiement",
      p_thanks: "Merci",
      cart_empty: "Vide",
      cart_n: "{n} article(s)",
      st_idle: "En attente des coordonnées",
      st_armed: "Minuteur en cours · {s} s",
      st_sending: "Demande d'appel…",
      st_sent: "Appel demandé",
      st_sent_dry: "Worker en mode test : aucun appel passé",
      st_dry: "Aucun appel passé (mode test)",
      st_dry_rehearsal: "Aucun appel passé (répétition)",
      st_error: "Échec de la demande",
      st_converted: "Commande validée, pas d'appel",
      st_cancelled: "Annulé",
      k_event: "ID d'événement",
      sr_pending: "pas encore",
      sr_active: "en cours",
      sr_done: "terminé",
      sr_sim: "simulé, répétition",
      sr_warn: "problème",
      sr_skip: "ignoré",

      tl_title: "Ce qui se passe en coulisses",
      ev_captured: "Panier enregistré",
      ev_captured_p: "En attente d'un prénom et d'un mobile.",
      ev_captured_d: "Prénom, mobile et panier sont enregistrés. Le client n'a pas encore payé.",
      ev_armed: "Minuteur lancé",
      ev_armed_p: "Démarre dès que les coordonnées sont enregistrées.",
      ev_armed_live: "Il tourne sur le serveur, donc même si cet onglet se ferme. Encore {s} s. Il repart si le panier, la langue ou les coordonnées changent.",
      ev_armed_local: "Il tourne dans ce navigateur (répétition, sans serveur). Encore {s} s.",
      ev_armed_done: "Le minuteur est terminé.",
      ev_armed_skipped: "Passé : « Appeler » a été pressé avant la fin du minuteur.",
      ev_armed_stopped: "Arrêté avant la fin.",
      ev_armed_failed: "Le minuteur n'a pas pu être lancé : {msg}",
      ev_knows: "Ce qu'Emma sait",
      ev_knows_p: "Elle reçoit le panier avant de composer le numéro.",
      ev_knows_d: "{name} · {items} · {total}. Elle peut proposer le code {code}.",
      ev_open: "Sa phrase d'ouverture",
      ev_opening: "Bonjour {name}, ici Emma de Maison Claire. Je vous appelle car vous avez laissé quelques articles dans votre panier il y a un instant. Vous avez une petite minute ?",
      ev_call: "Appel demandé",
      ev_call_p: "Envoyé à Aircall à la fin du minuteur.",
      ev_call_active: "Demande d'appel envoyée à Aircall…",
      ev_call_sent: "Aircall a reçu la demande d'appeler le {phone}.",
      ev_call_workerdry: "Worker en mode test : Aircall n'a pas été sollicité, aucun appel passé.",
      ev_call_rehearsal: "Répétition : rien n'a été envoyé. Voici ce qui partirait chez Aircall.",
      ev_call_failed: "La demande a échoué : {msg}",
      ev_call_skipped: "Aucun appel n'a été passé.",
      ev_payload_sent: "Ce qui a été envoyé",
      ev_payload_dry: "Ce qui serait envoyé",
      ev_rec: "Commande récupérée",
      ev_rec_p: "Quand le client revient et valide sa commande.",
      ev_rec_d: "Le client a validé sa commande après l'appel.",
      ev_rec_plain: "La commande a été validée.",
      ev_rec_early: "Validée avant la fin du minuteur : aucun appel nécessaire.",
      ev_rec_cancelled: "Annulé : ni appel, ni commande."
    }
  };

  const root = document.documentElement;
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  let lang = null;
  let tick = null;
  let flash = "";          // a one-off message shown under the presenter buttons
  let lastStatus = null;
  let notes = false;       // talking points for the presenter, hidden by default
  try { notes = sessionStorage.getItem("mc_guide_notes") === "1"; } catch (e) { /* ignore */ }

  function t(key, vars) {
    let s = (STR[lang] && STR[lang][key]) || STR.en[key] || key;
    Object.keys(vars || {}).forEach((k) => { s = s.replace("{" + k + "}", () => String(vars[k])); });
    return s;
  }

  /* ------------------------------------------------------------------ markup */
  const HEADSET = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></svg>';
  const STEP_LIS = [1, 2, 3, 4, 5].map((n) => '<li><span class="gd-dot"></span><span class="gd-lab" data-gd="s' + n + '"></span></li>').join("");
  const CHECK_LIS = [1, 2, 3].map((n) => '<li><span class="gd-tick"></span><div><strong data-out="c' + n + 't"></strong><span data-out="c' + n + 'd"></span></div></li>').join("");

  // The five backstage events. "knows" carries Emma's opening line, "call" carries the payload view.
  const TL_EXTRA = {
    knows: '<blockquote class="gd-quote" data-ev-quotebox hidden><span class="gd-eyebrow" data-gd="ev_open"></span><p data-ev-quote></p></blockquote>',
    call: '<details class="gd-payload" data-ev-payload hidden><summary data-ev-psum></summary><dl class="gd-vars" data-ev-vars></dl></details>'
  };
  const TL_EVENTS = ["captured", "armed", "knows", "call", "rec"];
  const TL_LIS = TL_EVENTS.map((k) => (
    '<li data-ev="' + k + '"><span class="gd-node"></span><div class="gd-ev">' +
    '<div class="gd-ev-h"><strong data-gd="ev_' + k + '"></strong><span class="gd-sr" data-ev-state></span><time data-ev-time></time></div>' +
    '<p data-ev-d></p>' + (TL_EXTRA[k] || "") + "</div></li>"
  )).join("");

  // Static markup only: every value that comes from the store is written with textContent below.
  const panel = document.createElement("aside");
  panel.className = "gd-panel";
  panel.id = "gd-panel";
  panel.innerHTML = `
    <button type="button" class="gd-tab" data-gd-action="expand">${HEADSET}<span class="gd-eyebrow" data-gd="eyebrow"></span></button>
    <div class="gd-head">
      <div class="gd-head-row">
        <div class="gd-wordmark">${HEADSET}aircall.ai</div>
        <button type="button" class="gd-icon-btn" data-gd-action="collapse">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
        </button>
      </div>
      <div class="gd-eyebrow" data-gd="eyebrow"></div>
      <h2 data-gd="title"></h2>
      <span class="gd-mode gd-eyebrow" data-mode="live"><i></i><span data-out="mode"></span></span>
    </div>
    <button type="button" class="gd-now" data-gd-action="top" hidden>
      <span class="gd-eyebrow" data-out="nowstep"></span><strong data-out="nowdo"></strong>
    </button>
    <div class="gd-body">
      <ol class="gd-steps">${STEP_LIS}</ol>
      <section class="gd-card gd-coach">
        <div class="gd-card-h" data-out="stepno"></div>
        <div class="gd-card-b">
          <h3 class="gd-do" data-out="do" aria-live="polite"></h3>
          <p class="gd-why" data-out="why"></p>
          <div class="gd-ringbox" data-out="ringbox" hidden>
            <div class="gd-ring" data-out="ring" role="timer" aria-live="off"><span data-out="secs"></span></div>
          </div>
          <ul class="gd-check" data-out="check" hidden>${CHECK_LIS}</ul>
          <p class="gd-hint" data-out="hint"></p>
          <p class="gd-restart" data-out="restart"></p>
          <div class="gd-say" data-out="say" hidden><span class="gd-eyebrow" data-gd="say"></span><p data-out="saytext"></p></div>
          <button type="button" class="gd-btn primary gd-coachbtn" data-gd-action="coach" data-out="coachbtn" hidden></button>
        </div>
      </section>
      <section class="gd-card gd-tl">
        <div class="gd-card-h" data-gd="tl_title"></div>
        <ol class="gd-tlist">${TL_LIS}</ol>
      </section>
      <details class="gd-card gd-controls">
        <summary data-gd="controls"></summary>
        <div class="gd-card-b">
          <dl class="gd-kv">
            <dt data-gd="k_page"></dt><dd data-out="page"></dd>
            <dt data-gd="k_cart"></dt><dd data-out="cart"></dd>
            <dt data-gd="k_who"></dt><dd data-out="who"></dd>
            <dt data-gd="k_call"></dt><dd data-out="call"></dd>
            <dt data-gd="k_event" data-out="eventk" hidden></dt><dd data-out="event" hidden></dd>
          </dl>
          <div class="gd-btns">
            <button type="button" class="gd-btn primary" data-gd-action="call" data-gd="call_now"></button>
            <button type="button" class="gd-btn" data-gd-action="cancel" data-gd="cancel"></button>
            <button type="button" class="gd-btn" data-gd-action="reset" data-gd="reset"></button>
          </div>
          <p class="gd-note" data-out="note" role="status"></p>
          <div class="gd-row"><label for="gd-delay" data-gd="delay"></label><select id="gd-delay"></select></div>
          <div class="gd-row"><label for="gd-notes" data-gd="notes"></label><input type="checkbox" id="gd-notes" data-gd-action="notes"></div>
        </div>
      </details>
    </div>
    <div class="gd-foot" data-gd="foot"></div>`;
  document.body.appendChild(panel);

  const spot = document.createElement("div");
  spot.className = "gd-spot";
  spot.hidden = true;
  spot.setAttribute("aria-hidden", "true");
  const bubble = document.createElement("div");
  bubble.className = "gd-bubble";
  bubble.hidden = true;
  bubble.setAttribute("aria-hidden", "true");
  document.body.appendChild(spot);
  document.body.appendChild(bubble);

  const $ = (sel) => panel.querySelector(sel);
  const out = (name) => panel.querySelector('[data-out="' + name + '"]');
  const btn = (name) => panel.querySelector('[data-gd-action="' + name + '"]');
  const setText = (el, s) => { if (el.textContent !== s) el.textContent = s; };

  function applyLang() {
    panel.querySelectorAll("[data-gd]").forEach((el) => { el.textContent = t(el.getAttribute("data-gd")); });
    panel.setAttribute("aria-label", t("aria_panel"));
    panel.querySelector(".gd-steps").setAttribute("aria-label", t("steps"));
    btn("collapse").setAttribute("aria-label", t("hide"));
    btn("expand").setAttribute("aria-label", t("show"));
    $("#gd-delay").dataset.opts = ""; // the option labels carry a unit: rebuild them
  }

  function setCollapsed(on) {
    root.classList.toggle("guide-collapsed", on);
    try {
      if (on) sessionStorage.setItem("mc_guide_collapsed", "1");
      else sessionStorage.removeItem("mc_guide_collapsed");
    } catch (e) { /* ignore */ }
    (on ? btn("expand") : btn("collapse")).focus();
    schedule(400);
  }

  function setNotes(on) {
    notes = on;
    try {
      if (on) sessionStorage.setItem("mc_guide_notes", "1");
      else sessionStorage.removeItem("mc_guide_notes");
    } catch (e) { /* ignore */ }
    update();
  }

  /* ------------------------------------------------------------------ what step are we on? */
  // 1 add, 2 check out, 3 details, 4 wait, 5 recover; or "done", "cancelled", "error".
  function derive(v) {
    const st = v.recovery.status;
    if (v.route.a === "thank-you") return "done";
    if (st === "converted" && v.cartCount === 0) return "done";
    if (st === "error") return "error";
    if (st === "cancelled") return "cancelled";
    if (st === "sent" || st === "dry") return 5;
    if (st === "armed" || st === "sending") return 4;
    if (v.cartCount === 0) return 1;
    if (v.route.a !== "checkout") return 2;
    return 3;
  }

  // What is typed in the checkout form right now (it is only on that page).
  function formState() {
    const first = document.getElementById("f-first");
    const last = document.getElementById("f-last");
    const phone = document.getElementById("f-phone");
    const country = document.getElementById("f-country");
    if (!first || !phone) return null;
    const act = document.activeElement ? document.activeElement.id : "";
    return {
      name: first.value.trim(),
      last: last ? last.value.trim() : "",
      phoneRaw: phone.value.trim(),
      masked: API.phonePreview(country ? country.value : "FR", phone.value),
      focus: act, // which field the visitor is in right now, so the spotlight never leaves a field being typed in
      // the last name is optional: once the visitor has moved on to a later field, stop pointing at it
      pastLast: act === "f-email" || act === "f-country" || act === "f-phone"
    };
  }

  // The checkout we are following: the one being filled in, or (after the order) the last one with a result.
  const currentRef = (v) => (v.checkout && v.checkout.ref) || v.recovery.checkoutId || null;

  // Timeline stamps for that checkout: when each backstage event was first seen, plus what was known and
  // sent at the time (the cart is empty once the order is done). Kept for this tab, so a reload keeps the story.
  let stamps = { ref: null };
  try { stamps = JSON.parse(sessionStorage.getItem("mc_guide_tl")) || stamps; } catch (e) { /* ignore */ }
  function observe(v, cv) {
    const r = v.recovery;
    const st = r.status;
    const ref = currentRef(v);
    if (!ref) return;
    const before = JSON.stringify(stamps);
    const now = Date.now();
    if (stamps.ref !== ref) stamps = { ref: ref };
    if (v.checkout) stamps.captured = stamps.captured || now;
    if (cv && !stamps.requested) { // what Emma was told is frozen once the request has gone out
      stamps.know = { name: cv.firstName, items: cv.items, total: cv.total, code: cv.code, rows: cv.rows };
      const ph = cv.rows.filter((row) => row[0] === "contact_phone")[0];
      if (ph) stamps.phone = ph[1];
    }
    if (st === "armed") stamps.armed = stamps.armed || now;
    if (["sending", "sent", "dry"].indexOf(st) !== -1 && !stamps.requested) {
      stamps.requested = now;
      stamps.early = !!(lastDeadline && now < lastDeadline - 1500); // asked before the timer ended: "Call now"
      if (cv) stamps.sent = cv.rows; // freeze what went out
    }
    if (st === "sent") { stamps.result = r.workerDryRun ? "workerdry" : "sent"; stamps.msg = ""; }
    else if (st === "dry") { stamps.result = "dry"; stamps.msg = ""; }
    else if (st === "error" && stamps.requested) { stamps.result = "error"; stamps.msg = r.message || ""; }
    if (st === "armed" || st === "sending") { delete stamps.end; delete stamps.endKind; } // re-armed after a cancel
    if ((st === "converted" || st === "cancelled") && !stamps.end) { stamps.end = now; stamps.endKind = st; }
    const after = JSON.stringify(stamps);
    if (after !== before) { try { sessionStorage.setItem("mc_guide_tl", after); } catch (e) { /* ignore */ } }
  }

  // The countdown restarts when the cart, the language or the details change: say so.
  let lastDeadline = 0;
  let lastRef = null;
  let restartUntil = 0;
  function noteRestart(v) {
    const r = v.recovery;
    if (r.status === "armed" && r.deadline) {
      if (r.checkoutId === lastRef && lastDeadline && r.deadline > lastDeadline + 1200) restartUntil = Date.now() + 8000;
      lastDeadline = r.deadline;
      lastRef = r.checkoutId;
    } else if (r.status !== "armed") {
      lastDeadline = 0;
    }
  }

  /* ------------------------------------------------------------------ coach content */
  function coachModel(v, d, form) {
    const r = v.recovery;
    const m = { head: "", doText: "", why: "", say: "", check: null, hint: "", btn: null, ring: false };
    switch (d) {
      case 1:
        m.doText = t("c1_do"); m.why = t("c1_why"); m.say = t("c1_say");
        break;
      case 2:
        m.doText = t("c2_do"); m.why = t("c2_why"); m.say = t("c2_say");
        break;
      case 3: {
        m.doText = t("c3_do"); m.why = t("c3_why"); m.say = t("c3_say");
        const name = form ? form.name : "";
        const masked = form ? form.masked : null;
        const typed = form ? form.phoneRaw : "";
        m.check = [
          { done: !!name, title: t("chk_first"), desc: name ? t("chk_first_ok", { name: name }) : t("chk_first_todo") },
          { done: !!(form && form.last), title: t("chk_last"), desc: form && form.last ? t("chk_last_ok") : t("chk_last_todo") },
          {
            done: !!masked,
            warn: !masked && !!typed,
            title: t("chk_phone"),
            desc: masked
              ? t("chk_phone_ok", {
                phone: masked.text + (masked.country ? " (" + masked.country + ")" : ""),
                lang: t(v.lang === "fr" ? "in_fr" : "in_en")
              })
              : t(typed ? "chk_phone_bad" : "chk_phone_todo")
          }
        ];
        if (name && masked) m.hint = t("c3_go");
        break;
      }
      case 4:
        m.say = t("c4_say");
        if (r.status === "sending") {
          m.doText = t("c4_sending_do"); m.why = t("c4_sending_why");
        } else {
          m.doText = t("c4_do"); m.why = t("c4_why"); m.ring = true;
        }
        break;
      case 5: {
        // "dry": the store placed no call (rehearsal / no endpoint); a Worker dry run reports "sent" but rings nothing either
        const dry = r.status === "dry" || (r.status === "sent" && !!r.workerDryRun);
        m.say = t("c5_say");
        if (!v.discountApplied) {
          m.doText = t(dry ? "c5_dry_do" : "c5_do");
          m.why = t(dry ? "c5_dry_why" : "c5_why");
          // the code field only exists on the checkout pages
          if (document.querySelector("#app [data-discount-form]")) m.btn = { act: "apply", label: t("c5_apply", { code: v.discountCode }) };
        } else {
          m.doText = t("c5b_do"); m.why = t("c5b_why");
        }
        break;
      }
      case "done": {
        const recovered = stamps.ref === currentRef(v) && !!stamps.requested;
        m.head = t("lbl_done");
        m.doText = t(recovered ? "done_do" : "done_nocall_do");
        // a rehearsal places no call: say what would have happened instead of claiming it did
        m.why = t(recovered ? (v.mode === "live" ? "done_why" : "done_dry_why") : "done_nocall_why");
        m.say = recovered ? t("done_say") : "";
        m.btn = { act: "again", label: t("again") };
        break;
      }
      case "cancelled":
        m.head = t("lbl_cancelled");
        m.doText = t("cancel_do"); m.why = t("cancel_why");
        m.btn = { act: "again", label: t("again") };
        break;
      case "error": {
        // an error before any call was requested means the timer itself could not be set
        const armFailed = !(stamps.ref === currentRef(v) && stamps.requested);
        m.head = t("lbl_error");
        m.doText = t(armFailed ? "err_arm_do" : "err_do");
        m.why = t(armFailed ? "err_arm_why" : "err_why");
        m.btn = { act: "retry", label: t("retry") };
        break;
      }
      default:
    }
    if (typeof d === "number") m.head = t("step_of", { n: d });
    return m;
  }

  function renderSteps(d) {
    const cur = typeof d === "number" ? d : d === "done" ? 6 : 4;
    panel.querySelectorAll(".gd-steps li").forEach((li, i) => {
      const n = i + 1;
      const done = n < cur;
      const now = n === cur;
      li.className = (done ? "is-done" : "") + (now ? " is-now" : "") + (now && (d === "error" || d === "cancelled") ? " is-warn" : "");
      setText(li.querySelector(".gd-dot"), done ? "✓" : String(n));
      if (now) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }

  function renderCoach(v, d, form) {
    const m = coachModel(v, d, form);
    const r = v.recovery;
    setText(out("stepno"), m.head);
    setText(out("do"), m.doText);
    setText(out("nowstep"), m.head);
    setText(out("nowdo"), m.doText);
    setText(out("why"), m.why);

    // countdown ring (step 4)
    out("ringbox").hidden = !m.ring;
    if (m.ring && r.deadline) {
      const left = Math.max(0, r.deadline - Date.now());
      setText(out("secs"), String(Math.ceil(left / 1000)));
      out("ring").style.setProperty("--p", Math.min(1, left / (r.delaySeconds * 1000)).toFixed(3));
    }

    // what is typed in the form, field by field (step 3)
    out("check").hidden = !m.check;
    if (m.check) {
      out("check").querySelectorAll("li").forEach((li, i) => {
        const c = m.check[i];
        li.className = (c.done ? "is-done" : "") + (c.warn ? " is-warn" : "");
        setText(li.querySelector(".gd-tick"), c.done ? "✓" : c.warn ? "!" : "");
        setText(out("c" + (i + 1) + "t"), c.title);
        setText(out("c" + (i + 1) + "d"), c.desc);
      });
    }

    setText(out("hint"), m.hint);
    setText(out("restart"), d === 4 && Date.now() < restartUntil ? t("c4_restart") : "");

    out("say").hidden = !(notes && m.say);
    setText(out("saytext"), m.say);

    const b = out("coachbtn");
    b.hidden = !m.btn;
    if (m.btn) { b.setAttribute("data-act", m.btn.act); setText(b, m.btn.label); }
  }

  /* ------------------------------------------------------------------ behind the scenes timeline */
  const mmss = (ms) => {
    const n = Math.max(0, Math.round(ms / 1000));
    return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  };

  // One entry per event: state (pending, active, done, sim, warn, skip), text, and when it happened.
  function tlModel(v, s) {
    const r = v.recovery;
    const st = r.status;
    const live = v.mode === "live";
    const secs = r.deadline ? Math.max(0, Math.ceil((r.deadline - Date.now()) / 1000)) : 0;
    const m = {};

    m.captured = s.captured
      ? { state: "done", d: t("ev_captured_d"), at: s.captured }
      : { state: "pending", d: t("ev_captured_p") };

    const armedAt = s.armed || s.requested;
    if (st === "armed") m.armed = { state: "active", d: t(live ? "ev_armed_live" : "ev_armed_local", { s: secs }), at: s.armed };
    else if (st === "error" && !s.requested) m.armed = { state: "warn", d: t("ev_armed_failed", { msg: r.message }), at: s.armed };
    else if (armedAt) m.armed = { state: "done", d: t(s.requested ? (s.early ? "ev_armed_skipped" : "ev_armed_done") : "ev_armed_stopped"), at: armedAt };
    else m.armed = { state: "pending", d: t("ev_armed_p") };

    const k = s.know;
    m.knows = k
      ? { state: "done", d: t("ev_knows_d", { name: k.name, items: k.items, total: k.total, code: k.code }), quote: t("ev_opening", { name: k.name }), at: s.captured }
      : { state: "pending", d: t("ev_knows_p") };

    let call;
    if (st === "sending") call = { state: "active", d: t("ev_call_active"), at: s.requested };
    else if (s.result === "sent") call = { state: "done", d: t("ev_call_sent", { phone: s.phone || "" }), at: s.requested };
    else if (s.result === "workerdry") call = { state: "sim", d: t("ev_call_workerdry"), at: s.requested };
    else if (s.result === "dry") call = { state: "sim", d: t("ev_call_rehearsal"), at: s.requested };
    else if (s.result === "error") call = { state: "warn", d: t("ev_call_failed", { msg: s.msg }), at: s.requested };
    else if (s.endKind) call = { state: "skip", d: t("ev_call_skipped") };
    else call = { state: "pending", d: t("ev_call_p") };
    // the variables Emma gets: frozen at the moment of the request, a live preview before that
    call.rows = call.state === "skip" ? null : (s.sent || (k && k.rows) || null);
    call.wasSent = s.result === "sent";
    m.call = call;

    if (s.endKind === "converted") m.rec = { state: "done", d: t(!s.requested ? "ev_rec_early" : s.result === "sent" ? "ev_rec_d" : "ev_rec_plain"), at: s.end };
    else if (s.endKind === "cancelled") m.rec = { state: "skip", d: t("ev_rec_cancelled"), at: s.end };
    else m.rec = { state: "pending", d: t("ev_rec_p") };
    return m;
  }

  let tlKey = "";
  let varsKey = "";
  function renderTimeline(v, s) {
    const m = tlModel(v, s);
    const t0 = s.captured || 0;
    let latest = null;
    panel.querySelectorAll(".gd-tlist > li").forEach((li) => {
      const ev = li.getAttribute("data-ev");
      const e = m[ev];
      const cls = "is-" + e.state;
      if (li.className !== cls) li.className = cls;
      setText(li.querySelector("[data-ev-d]"), e.d);
      setText(li.querySelector("[data-ev-state]"), ", " + t("sr_" + e.state));
      if (e.state === "active") li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      setText(li.querySelector("[data-ev-time]"), e.at && t0 ? (ev === "captured" ? "" : "+") + mmss(e.at - t0) : "");
      if (e.state !== "pending") latest = li;

      if (ev === "knows") {
        li.querySelector("[data-ev-quotebox]").hidden = !e.quote;
        setText(li.querySelector("[data-ev-quote]"), e.quote ? "“" + e.quote + "”" : "");
      }
      if (ev === "call") {
        const box = li.querySelector("[data-ev-payload]");
        const rows = e.rows && e.rows.length ? e.rows : null;
        box.hidden = !rows;
        if (rows) {
          setText(box.querySelector("[data-ev-psum]"), t(e.wasSent ? "ev_payload_sent" : "ev_payload_dry"));
          const key = lang + "|" + JSON.stringify(rows);
          if (key !== varsKey) { // rebuild only on change, so an opened list stays open
            varsKey = key;
            const dl = box.querySelector("[data-ev-vars]");
            dl.textContent = "";
            rows.forEach((row) => {
              const dt = document.createElement("dt");
              const dd = document.createElement("dd");
              dt.textContent = row[0];
              dd.textContent = row[1];
              dl.appendChild(dt);
              dl.appendChild(dd);
            });
          }
        }
      }
    });

    // when a new event lands, make sure it is visible in the scrolling panel (without moving the page)
    const key = TL_EVENTS.map((ev) => m[ev].state).join();
    if (key !== tlKey) {
      tlKey = key;
      if (latest) {
        const body = $(".gd-body");
        const a = latest.getBoundingClientRect();
        const b = body.getBoundingClientRect();
        // only when the event's title is out of sight, and no further than needed: the coach card
        // above it should stay readable
        if (a.top > b.bottom - 70) body.scrollTop += a.top - (b.bottom - 150);
        else if (a.top < b.top) body.scrollTop -= b.top - a.top + 16;
      }
    }
  }

  /* ------------------------------------------------------------------ spotlight on the real page */
  function visible(el) { return !!(el && el.getClientRects().length); }
  function firstVisible(sel) {
    const list = document.querySelectorAll(sel);
    for (let i = 0; i < list.length; i++) if (visible(list[i])) return list[i];
    return null;
  }

  function targetFor(v, d, form) {
    const pick = (el, labelKey, kind) => (el
      ? { el: el, kind: kind || "go", label: t(labelKey), key: d + "|" + labelKey + "|" + v.route.a + "/" + v.route.b }
      : null);
    const toCheckout = () => (document.body.classList.contains("cart-open")
      ? pick(firstVisible("#cart-drawer .drawer-foot a.btn"), "b_checkout")
      : pick(firstVisible(".site-header .cart-button"), "b_cart"));
    switch (d) {
      case 1: {
        // On a product page: the add button. On the home page or the shop: follow the visitor, pointing at
        // whatever is on screen (an item with options first: the table and armchair give Emma more to say),
        // and only scroll when nothing suitable is in view.
        const addPage = firstVisible("#app [data-add-page]");
        if (addPage) return pick(addPage, "b_add");
        const edge = panel.getBoundingClientRect().left;
        const onScreen = (sel) => {
          const list = document.querySelectorAll(sel);
          for (let i = 0; i < list.length; i++) {
            const r = list[i].getBoundingClientRect();
            if (visible(list[i]) && r.top >= 70 && r.bottom <= window.innerHeight - 8 && r.right <= edge) return list[i];
          }
          return null;
        };
        return pick(onScreen("#app .card a.btn"), "b_options")
          || pick(onScreen("#app [data-add]"), "b_add")
          || (v.route.a === "shop" ? null : pick(onScreen("#app .hero a.btn"), "b_browse")) // already clicked once: the store is taking them to the collection
          || pick(firstVisible("#app .card a.btn"), "b_options")
          || pick(firstVisible("#app [data-add]"), "b_add");
      }
      case 2:
        return toCheckout();
      case 3:
        if (!form) return null;
        // first name, then last name, then the phone. Stay on a field while the visitor is typing in it.
        if (!form.name || form.focus === "f-first") return pick(document.getElementById("f-first"), "b_first");
        if (document.getElementById("f-last") && (form.focus === "f-last" || (!form.last && !form.pastLast && !form.phoneRaw))) {
          return pick(document.getElementById("f-last"), "b_last");
        }
        if (!form.masked) return pick(document.getElementById("f-phone"), "b_phone");
        return pick(document.getElementById("f-phone"), "b_tab");
      case 4:
        // the one button that would cancel the call
        return v.route.b === "payment" ? pick(firstVisible("#app [data-complete-order]"), "b_not_yet", "wait") : null;
      case 5:
        if (v.route.a !== "checkout") return toCheckout();
        if (!v.discountApplied) return pick(firstVisible("#app [data-discount-form] input"), "b_code");
        if (v.route.b === "payment") return pick(firstVisible("#app [data-complete-order]"), "b_complete");
        return pick(firstVisible("#contact-form button[type=submit]"), "b_continue");
      default:
        return null;
    }
  }

  let curStep = null;
  let spotEl = null;
  let spotKey = "";
  let raf = 0;
  let burstUntil = 0;

  function place() {
    if (!spotEl || !spotEl.isConnected || !visible(spotEl)) { spot.hidden = true; bubble.hidden = true; return; }
    const r = spotEl.getBoundingClientRect();
    const limit = panel.getBoundingClientRect().left; // the store ends where the panel starts
    if (r.bottom < 0 || r.top > window.innerHeight || r.left > limit) { spot.hidden = true; bubble.hidden = true; return; }
    const pad = 6;
    spot.hidden = false;
    bubble.hidden = false;
    spot.style.top = r.top - pad + "px";
    spot.style.left = r.left - pad + "px";
    spot.style.width = r.width + pad * 2 + "px";
    spot.style.height = r.height + pad * 2 + "px";
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    // below the target when there is room (above would often cover the label or control just before it)
    let top = r.bottom + pad + 10;
    if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - pad - bh - 10);
    const left = Math.min(Math.max(r.left - pad, 8), Math.max(8, limit - bw - 8));
    bubble.style.top = top + "px";
    bubble.style.left = left + "px";
  }

  // Follow a target that is still moving (drawer sliding in, page scrolling) for a short burst of frames.
  function frame() {
    raf = 0;
    place();
    if (performance.now() < burstUntil) raf = requestAnimationFrame(frame);
  }
  function schedule(ms) {
    burstUntil = Math.max(burstUntil, performance.now() + (ms || 0));
    if (!raf) raf = requestAnimationFrame(frame);
  }

  let scrollTimer = 0;
  // Run fn once the page has stopped scrolling: two checks in a row, 150 ms apart, with no movement
  // (at the earliest 500 ms after the route change). Gives up waiting after about 4 seconds.
  function settleThen(fn) {
    clearTimeout(scrollTimer);
    let lastY = window.scrollY;
    let still = 0;
    let tries = 0;
    const tick = () => {
      tries += 1;
      const y = window.scrollY;
      still = Math.abs(y - lastY) < 1 ? still + 1 : 0;
      lastY = y;
      if (still >= 2 || tries > 25) { fn(); return; }
      scrollTimer = setTimeout(tick, 150);
    };
    scrollTimer = setTimeout(tick, 350);
  }
  function ensureVisible() {
    const el = spotEl;
    if (!el || !el.isConnected || !visible(el)) return;
    // A target in the fixed header or the cart drawer is already in view, and scrolling for it
    // would only move the page behind it.
    if (el.closest(".cart-drawer, .site-header")) return;
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 24) {
      el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      schedule(900);
    }
  }

  function setTarget(tgt) {
    if (!tgt) { spotEl = null; spotKey = ""; spot.hidden = true; bubble.hidden = true; return; }
    spotEl = tgt.el;
    spot.setAttribute("data-kind", tgt.kind);
    bubble.setAttribute("data-kind", tgt.kind);
    setText(bubble, tgt.label);
    place(); // right away, then keep following for a few frames
    if (tgt.key !== spotKey) {
      spotKey = tgt.key;
      // The store moves the page after a route change (it jumps to the top, or scrolls down to the
      // collection when the visitor clicks "Découvrir la collection"). Wait until the page has stopped
      // moving, look at what is on screen again, and only then bring the target into view if it still isn't.
      // Scrolling for the old target while the store is still scrolling pulls the visitor back to it,
      // and their click looks like it did nothing.
      settleThen(() => {
        const key = spotKey;
        update(); // the target may have changed while the page moved
        if (spotKey === key) ensureVisible();
      });
      schedule(900);
    } else {
      schedule(0);
    }
  }

  /* ------------------------------------------------------------------ panel details */
  function pageLabel(r) {
    if (r.a === "product") return t("p_product");
    if (r.a === "checkout") return t(r.b === "payment" ? "p_payment" : "p_info");
    if (r.a === "thank-you") return t("p_thanks");
    return t("p_home");
  }

  function callLabel(r, mode) {
    switch (r.status) {
      case "armed": return t("st_armed", { s: Math.max(0, Math.ceil((r.deadline - Date.now()) / 1000)) });
      case "sending": return t("st_sending");
      case "sent": return t(r.workerDryRun ? "st_sent_dry" : "st_sent");
      case "dry": return t(mode === "rehearsal" ? "st_dry_rehearsal" : "st_dry");
      case "error": return t("st_error");
      case "converted": return t("st_converted");
      case "cancelled": return t("st_cancelled");
      default: return t("st_idle");
    }
  }

  function syncDelay(n) {
    const sel = $("#gd-delay");
    const opts = [10, 15, 20, 30, 45, 60];
    if (opts.indexOf(n) === -1) opts.push(n);
    opts.sort((a, b) => a - b);
    if (sel.dataset.opts !== opts.join()) {
      sel.innerHTML = opts.map((o) => '<option value="' + o + '">' + t("sec", { n: o }) + "</option>").join("");
      sel.dataset.opts = opts.join();
    }
    if (document.activeElement !== sel) sel.value = String(n);
  }

  function update() {
    const v = API.view();
    if (v.lang !== lang) { lang = v.lang; applyLang(); }
    const r = v.recovery;
    if (r.status !== lastStatus) { lastStatus = r.status; flash = ""; }

    observe(v, API.callView());
    noteRestart(v);
    const d = derive(v);
    curStep = d;
    const form = d === 3 ? formState() : null;
    const story = stamps.ref && stamps.ref === currentRef(v) ? stamps : {}; // nothing yet for a fresh demo

    renderSteps(d);
    renderCoach(v, d, form);
    renderTimeline(v, story);
    setTarget(targetFor(v, d, form));

    // presenter controls
    $(".gd-mode").setAttribute("data-mode", v.mode);
    setText(out("mode"), t("mode_" + v.mode));
    setText(out("page"), pageLabel(v.route));
    setText(out("cart"), v.cartCount ? t("cart_n", { n: v.cartCount }) : t("cart_empty"));
    setText(out("who"), v.checkout
      ? v.checkout.firstName + (v.checkout.lastInitial ? " " + v.checkout.lastInitial + "." : "") + " · " + v.checkout.phone
      : "—");
    setText(out("call"), callLabel(r, v.mode));
    out("eventk").hidden = out("event").hidden = !r.eventId; // Aircall's event id, to look the call up afterwards
    setText(out("event"), r.eventId || "");
    setText(out("note"), flash || (r.status === "error" && r.message ? t("err_detail", { msg: r.message }) : ""));
    btn("cancel").disabled = ["armed", "error", "dry"].indexOf(r.status) === -1;
    btn("call").disabled = r.status === "sending";
    btn("notes").checked = notes;
    syncDelay(r.delaySeconds);

    // the countdown needs a heartbeat only while a timer is running
    if (r.status === "armed" && !tick) tick = setInterval(update, 500);
    else if (r.status !== "armed" && tick) { clearInterval(tick); tick = null; }
  }

  function applyCode() {
    const v = API.view();
    const forms = document.querySelectorAll("#app [data-discount-form]");
    let form = null;
    forms.forEach((f) => { if (!form && visible(f)) form = f; });
    form = form || forms[0];
    if (!form || !form.elements.code) return;
    form.elements.code.value = v.discountCode;
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  }

  /* ------------------------------------------------------------------ events */
  panel.addEventListener("click", (e) => {
    const el = e.target.closest("[data-gd-action]");
    if (!el) return;
    const action = el.getAttribute("data-gd-action");
    if (action === "collapse") setCollapsed(true);
    else if (action === "top") $(".gd-body").scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    else if (action === "expand") setCollapsed(false);
    else if (action === "notes") setNotes(el.checked);
    else if (action === "call") { flash = API.actions.callNow() ? "" : t("need_contact"); update(); }
    else if (action === "cancel") API.actions.cancel();
    else if (action === "reset") { flash = ""; API.actions.reset(); }
    else if (action === "coach") {
      const act = el.getAttribute("data-act");
      if (act === "apply") applyCode();
      else if (act === "again") API.actions.reset();
      else if (act === "retry") {
        // a failed call is retried straight away; a timer that never started is started again
        const failedCall = stamps.ref === currentRef(API.view()) && !!stamps.requested;
        const ok = failedCall ? API.actions.callNow() : API.actions.rearm();
        flash = ok ? "" : t("need_contact");
        update();
      }
    }
  });
  $("#gd-delay").addEventListener("change", (e) => API.actions.setDelay(e.target.value));

  document.addEventListener("mc:change", update);
  // typing in the checkout form updates the coach before the store has captured anything
  document.addEventListener("input", update);
  document.addEventListener("change", update);
  // moving from one field to the next moves the spotlight with the visitor
  document.addEventListener("focusin", update);
  window.addEventListener("resize", () => schedule(0));
  // the cart drawer slides in: follow it until it has stopped
  document.addEventListener("transitionend", () => schedule(0), true);
  // capture: also scrolling inside the cart drawer. Step 1 points at what is on screen, so it follows the scroll.
  let scrollWatch = 0;
  window.addEventListener("scroll", () => {
    schedule(0);
    if (curStep === 1) { clearTimeout(scrollWatch); scrollWatch = setTimeout(update, 150); }
  }, true);

  // The store re-draws whole pages: find the target again whenever the page or the cart drawer changes.
  let pending = false;
  const redraw = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; update(); });
  });
  redraw.observe(document.getElementById("app"), { childList: true, subtree: true });
  redraw.observe(document.getElementById("cart-drawer"), { childList: true, subtree: true });
  redraw.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // When the panel is scrolled down to the timeline, keep the current instruction in sight as a slim bar.
  if (window.IntersectionObserver) {
    const now = $(".gd-now");
    new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      now.hidden = e.intersectionRatio >= 0.6;
    }, { root: $(".gd-body"), threshold: [0, 0.6, 1] }).observe(out("do"));
  }

  update();
})();

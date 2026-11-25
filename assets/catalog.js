/*
 * Product catalogue (English + French).
 *
 * Products were chosen to be easy for a voice agent in both languages:
 *  - one variant each (no sizes, colours or options to clarify)
 *  - plain everyday nouns that translate one to one (mug = tasse, candle = bougie)
 *  - no brand names, model numbers or acronyms
 *  - whole euro prices, so totals are said cleanly ("49 euros")
 *
 * "spoken" holds singular/plural forms used to build the sentence the agent
 * reads, e.g. "two ceramic mugs and one wool blanket".
 * "gender" is the French grammatical gender, used for "un" / "une".
 */
(function () {
  const svg = (bg, body) =>
    `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">` +
    `<rect width="400" height="400" fill="${bg}"/>${body}</svg>`;

  const ART = {
    mug: svg("#EFE6DA", `
      <ellipse cx="200" cy="316" rx="100" ry="13" fill="#000" opacity=".08"/>
      <path d="M266 176h16a40 40 0 0 1 0 80h-16" fill="none" stroke="#E0D8CC" stroke-width="18"/>
      <path d="M130 140h140v138a34 34 0 0 1-34 34h-72a34 34 0 0 1-34-34z" fill="#FBF9F5"/>
      <path d="M236 140h34v138a34 34 0 0 1-34 34z" fill="#EFEAE2"/>
      <rect x="130" y="180" width="140" height="7" fill="#D9B9A2"/>
      <ellipse cx="200" cy="140" rx="70" ry="12" fill="#F4F0EA"/>
      <ellipse cx="200" cy="141" rx="60" ry="8" fill="#7A5238"/>
      <path d="M182 116c-8-10 8-16 0-28M216 116c-8-10 8-16 0-28" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/>`),

    candle: svg("#F3E6D2", `
      <ellipse cx="200" cy="316" rx="88" ry="12" fill="#000" opacity=".08"/>
      <rect x="135" y="160" width="130" height="152" rx="16" fill="#C68A52"/>
      <path d="M231 160h18a16 16 0 0 1 16 16v120a16 16 0 0 1-16 16h-18z" fill="#B07642"/>
      <rect x="149" y="180" width="10" height="110" rx="5" fill="#fff" opacity=".28"/>
      <ellipse cx="200" cy="166" rx="62" ry="9" fill="#F7EEDF"/>
      <rect x="160" y="212" width="80" height="56" rx="4" fill="#FBF6EE"/>
      <rect x="176" y="229" width="48" height="5" rx="2.5" fill="#B9A58C"/>
      <rect x="184" y="243" width="32" height="4" rx="2" fill="#D3C4AF"/>
      <line x1="200" y1="166" x2="200" y2="146" stroke="#3B2F2A" stroke-width="3" stroke-linecap="round"/>
      <path d="M200 104c12 14 16 24 16 31a16 16 0 0 1-32 0c0-7 4-17 16-31z" fill="#F2A93B"/>
      <path d="M200 122c6 7 8 12 8 16a8 8 0 0 1-16 0c0-4 2-9 8-16z" fill="#FFE3A3"/>`),

    blanket: svg("#E3E7DC", `
      <ellipse cx="205" cy="312" rx="125" ry="12" fill="#000" opacity=".07"/>
      <rect x="88" y="232" width="224" height="74" rx="22" fill="#CDB89B"/>
      <rect x="88" y="186" width="224" height="70" rx="22" fill="#DCCAB0"/>
      <rect x="88" y="140" width="224" height="70" rx="22" fill="#E8DCC8"/>
      <rect x="258" y="140" width="9" height="166" fill="#A98E6B" opacity=".45"/>
      <rect x="275" y="140" width="5" height="166" fill="#A98E6B" opacity=".45"/>
      <line x1="318" y1="150" x2="318" y2="298" stroke="#CDB89B" stroke-width="12" stroke-dasharray="3 5"/>
      <path d="M104 186h190M104 232h190" stroke="#fff" stroke-width="2" opacity=".35"/>`),

    bottle: svg("#DCE5E6", `
      <ellipse cx="200" cy="326" rx="70" ry="11" fill="#000" opacity=".08"/>
      <path d="M186 86V74a14 14 0 0 1 28 0v12" fill="none" stroke="#2E3D40" stroke-width="7"/>
      <rect x="170" y="84" width="60" height="44" rx="12" fill="#2E3D40"/>
      <rect x="182" y="124" width="36" height="14" fill="#3A4D51"/>
      <rect x="160" y="134" width="80" height="188" rx="30" fill="#557A80"/>
      <path d="M210 134a30 30 0 0 1 30 30v128a30 30 0 0 1-30 30z" fill="#4A6C72"/>
      <rect x="173" y="158" width="9" height="138" rx="4.5" fill="#fff" opacity=".22"/>`),

    tote: svg("#EFE7D7", `
      <ellipse cx="200" cy="330" rx="110" ry="11" fill="#000" opacity=".07"/>
      <path d="M170 182c0-84 60-84 60 0" fill="none" stroke="#D6C7AA" stroke-width="11"/>
      <path d="M118 176h164l14 148H104z" fill="#F6EFE2"/>
      <path d="M246 176h36l14 148h-40z" fill="#ECE2D0"/>
      <rect x="118" y="176" width="164" height="9" fill="#E8DDC8"/>
      <circle cx="200" cy="258" r="26" fill="#C8735A"/>
      <rect x="162" y="262" width="76" height="5" fill="#F6EFE2"/>
      <rect x="170" y="273" width="60" height="4" fill="#F6EFE2"/>
      <path d="M150 214v-36c0-86 100-86 100 0v36" fill="none" stroke="#E4D7BE" stroke-width="12"/>`),

    notebook: svg("#E8E1D6", `
      <ellipse cx="208" cy="318" rx="95" ry="11" fill="#000" opacity=".08"/>
      <g transform="rotate(-5 200 200)">
        <rect x="134" y="96" width="150" height="212" rx="8" fill="#F7F3EC"/>
        <rect x="128" y="92" width="150" height="212" rx="8" fill="#8E9C87"/>
        <path d="M136 92h12v212h-12a8 8 0 0 1-8-8V100a8 8 0 0 1 8-8z" fill="#7D8B76"/>
        <rect x="252" y="92" width="8" height="212" fill="#2F3A2E"/>
        <rect x="164" y="132" width="74" height="28" rx="3" fill="#F4EFE6"/>
        <rect x="176" y="141" width="50" height="4" rx="2" fill="#B5AA97"/>
        <rect x="184" y="149" width="34" height="3" rx="1.5" fill="#CFC5B4"/>
      </g>`),

    towel: svg("#DCE6EA", `
      <ellipse cx="200" cy="314" rx="115" ry="12" fill="#000" opacity=".07"/>
      <rect x="100" y="232" width="200" height="76" rx="18" fill="#FFFFFF"/>
      <rect x="100" y="280" width="200" height="8" fill="#D2DDE2"/>
      <rect x="116" y="232" width="168" height="9" fill="#000" opacity=".04"/>
      <rect x="116" y="168" width="168" height="70" rx="18" fill="#F8FAF9"/>
      <rect x="116" y="210" width="168" height="7" fill="#C6D4DA"/>
      <rect x="270" y="248" width="14" height="20" rx="2" fill="#B8C7CD"/>`),

    lamp: svg("#EEE4D9", `
      <ellipse cx="200" cy="200" rx="160" ry="130" fill="#FFE7B0" opacity=".22"/>
      <ellipse cx="200" cy="205" rx="115" ry="92" fill="#FFE7B0" opacity=".28"/>
      <ellipse cx="200" cy="322" rx="80" ry="11" fill="#000" opacity=".08"/>
      <rect x="191" y="194" width="18" height="22" rx="3" fill="#9C5338"/>
      <path d="M200 210c-40 0-58 34-58 62 0 30 26 46 58 46s58-16 58-46c0-28-18-62-58-62z" fill="#C46F4E"/>
      <path d="M222 214c20 10 36 34 36 58 0 30-26 46-58 46 22-6 36-22 36-46 0-24-6-46-14-58z" fill="#A95D40"/>
      <path d="M146 96h108l34 104H112z" fill="#F7F1E7"/>
      <path d="M228 96h26l34 104h-40z" fill="#ECE3D5"/>
      <rect x="112" y="196" width="176" height="6" rx="3" fill="#E2D7C6"/>`)
  };

  window.CATALOG = [
    {
      id: "mug", price: 18, gender: "f", art: ART.mug,
      name: { en: "Ceramic Mug", fr: "Tasse en céramique" },
      spoken: { en: ["ceramic mug", "ceramic mugs"], fr: ["tasse en céramique", "tasses en céramique"] },
      short: {
        en: "A generous everyday mug in soft white stoneware.",
        fr: "Une grande tasse du quotidien en grès blanc."
      },
      description: {
        en: "Glazed stoneware with a smooth, comfortable handle. Holds a large coffee or tea. Microwave and dishwasher safe.",
        fr: "Grès émaillé avec une anse douce et confortable. Parfaite pour un grand café ou un thé. Compatible micro-ondes et lave-vaisselle."
      },
      details: {
        en: [["Material", "Stoneware ceramic"], ["Capacity", "350 ml"], ["Colour", "White"], ["Care", "Dishwasher safe"]],
        fr: [["Matière", "Grès céramique"], ["Contenance", "350 ml"], ["Couleur", "Blanc"], ["Entretien", "Lave-vaisselle"]]
      }
    },
    {
      id: "candle", price: 24, gender: "f", art: ART.candle,
      name: { en: "Vanilla Scented Candle", fr: "Bougie parfumée à la vanille" },
      spoken: { en: ["vanilla scented candle", "vanilla scented candles"], fr: ["bougie parfumée à la vanille", "bougies parfumées à la vanille"] },
      short: {
        en: "A warm vanilla candle in an amber glass jar.",
        fr: "Une bougie à la vanille dans un pot en verre ambré."
      },
      description: {
        en: "Natural soy wax and a cotton wick for a clean, slow burn. A gentle vanilla scent that fills a room without being overpowering.",
        fr: "Cire de soja naturelle et mèche en coton pour une combustion lente et propre. Un doux parfum de vanille qui embaume la pièce sans être trop fort."
      },
      details: {
        en: [["Wax", "Soy wax"], ["Burn time", "About 40 hours"], ["Weight", "200 g"], ["Scent", "Vanilla"]],
        fr: [["Cire", "Cire de soja"], ["Durée", "Environ 40 heures"], ["Poids", "200 g"], ["Parfum", "Vanille"]]
      }
    },
    {
      id: "blanket", price: 79, gender: "m", art: ART.blanket,
      name: { en: "Wool Blanket", fr: "Plaid en laine" },
      spoken: { en: ["wool blanket", "wool blankets"], fr: ["plaid en laine", "plaids en laine"] },
      short: {
        en: "A soft, warm blanket for the sofa or the bed.",
        fr: "Un plaid doux et chaud pour le canapé ou le lit."
      },
      description: {
        en: "Woven from pure wool in a natural beige colour, with a simple stripe and fringed edges. Warm in winter, breathable all year.",
        fr: "Tissé en pure laine beige naturel, avec une rayure simple et des franges. Chaud en hiver, respirant toute l'année."
      },
      details: {
        en: [["Material", "100% wool"], ["Size", "130 × 170 cm"], ["Colour", "Natural beige"], ["Care", "Hand wash cold"]],
        fr: [["Matière", "100 % laine"], ["Dimensions", "130 × 170 cm"], ["Couleur", "Beige naturel"], ["Entretien", "Lavage à la main à froid"]]
      }
    },
    {
      id: "bottle", price: 29, gender: "f", art: ART.bottle,
      name: { en: "Insulated Bottle", fr: "Gourde isotherme" },
      spoken: { en: ["insulated bottle", "insulated bottles"], fr: ["gourde isotherme", "gourdes isothermes"] },
      short: {
        en: "Keeps drinks cold for 24 hours or hot for 12.",
        fr: "Garde vos boissons froides 24 h ou chaudes 12 h."
      },
      description: {
        en: "Double wall stainless steel with a leak proof cap and a carry loop. Fits most cup holders.",
        fr: "Acier inoxydable double paroi, bouchon étanche et anse de transport. Se glisse dans la plupart des porte-gobelets."
      },
      details: {
        en: [["Material", "Stainless steel"], ["Capacity", "500 ml"], ["Colour", "Slate blue"], ["Care", "Hand wash"]],
        fr: [["Matière", "Acier inoxydable"], ["Contenance", "500 ml"], ["Couleur", "Bleu ardoise"], ["Entretien", "Lavage à la main"]]
      }
    },
    {
      id: "tote", price: 15, gender: "m", art: ART.tote,
      name: { en: "Cotton Tote Bag", fr: "Sac cabas en coton" },
      spoken: { en: ["cotton tote bag", "cotton tote bags"], fr: ["sac cabas en coton", "sacs cabas en coton"] },
      short: {
        en: "A sturdy everyday bag in organic cotton.",
        fr: "Un sac robuste du quotidien en coton bio."
      },
      description: {
        en: "Thick organic cotton canvas with long handles to wear on the shoulder, and an inside pocket for keys and phone.",
        fr: "Toile de coton bio épaisse, longues anses pour le porter à l'épaule et poche intérieure pour les clés et le téléphone."
      },
      details: {
        en: [["Material", "Organic cotton"], ["Size", "38 × 42 cm"], ["Colour", "Natural"], ["Care", "Machine wash 30 °C"]],
        fr: [["Matière", "Coton bio"], ["Dimensions", "38 × 42 cm"], ["Couleur", "Écru"], ["Entretien", "Machine à 30 °C"]]
      }
    },
    {
      id: "notebook", price: 12, gender: "m", art: ART.notebook,
      name: { en: "Paper Notebook", fr: "Carnet de notes" },
      spoken: { en: ["paper notebook", "paper notebooks"], fr: ["carnet de notes", "carnets de notes"] },
      short: {
        en: "A5 notebook with dotted pages and a linen cover.",
        fr: "Carnet A5 à pages pointillées et couverture en lin."
      },
      description: {
        en: "160 pages of thick recycled paper that lies flat when open, with an elastic band to keep it closed.",
        fr: "160 pages en papier recyclé épais qui reste bien à plat une fois ouvert, avec un élastique de fermeture."
      },
      details: {
        en: [["Format", "A5"], ["Pages", "160 dotted pages"], ["Paper", "Recycled"], ["Cover", "Sage green linen"]],
        fr: [["Format", "A5"], ["Pages", "160 pages pointillées"], ["Papier", "Recyclé"], ["Couverture", "Lin vert sauge"]]
      }
    },
    {
      id: "towel", price: 25, gender: "f", art: ART.towel,
      name: { en: "Cotton Bath Towel", fr: "Serviette de bain en coton" },
      spoken: { en: ["cotton bath towel", "cotton bath towels"], fr: ["serviette de bain en coton", "serviettes de bain en coton"] },
      short: {
        en: "A thick, absorbent towel in soft white cotton.",
        fr: "Une serviette épaisse et absorbante en coton blanc."
      },
      description: {
        en: "Heavy cotton that gets softer with every wash. Large enough to wrap around you after a shower.",
        fr: "Un coton épais qui devient plus doux à chaque lavage. Assez grande pour s'envelopper après la douche."
      },
      details: {
        en: [["Material", "100% cotton"], ["Size", "70 × 140 cm"], ["Colour", "White"], ["Care", "Machine wash 40 °C"]],
        fr: [["Matière", "100 % coton"], ["Dimensions", "70 × 140 cm"], ["Couleur", "Blanc"], ["Entretien", "Machine à 40 °C"]]
      }
    },
    {
      id: "lamp", price: 69, gender: "f", art: ART.lamp,
      name: { en: "Table Lamp", fr: "Lampe de table" },
      spoken: { en: ["table lamp", "table lamps"], fr: ["lampe de table", "lampes de table"] },
      short: {
        en: "A ceramic lamp with a linen shade for soft, warm light.",
        fr: "Une lampe en céramique avec abat-jour en lin pour une lumière douce."
      },
      description: {
        en: "Terracotta ceramic base and natural linen shade. Comes with an LED bulb and an on and off switch on the cable.",
        fr: "Pied en céramique terracotta et abat-jour en lin naturel. Livrée avec une ampoule LED et un interrupteur sur le câble."
      },
      details: {
        en: [["Material", "Ceramic and linen"], ["Height", "40 cm"], ["Bulb", "LED bulb included"], ["Colour", "Terracotta"]],
        fr: [["Matière", "Céramique et lin"], ["Hauteur", "40 cm"], ["Ampoule", "Ampoule LED incluse"], ["Couleur", "Terracotta"]]
      }
    }
  ];
})();

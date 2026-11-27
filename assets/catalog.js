/*
 * Product catalogue (English + French).
 *
 * Products were chosen to be easy for a voice agent in both languages:
 *  - small items have one variant each (no sizes, colours or options to clarify)
 *  - two furniture pieces (dining table, armchair) have options, so the agent can be
 *    tested on harder questions: wood, fabric, sizes, weights, lead times
 *  - plain everyday nouns that translate one to one (mug = tasse, candle = bougie)
 *  - no brand names, model numbers or acronyms
 *  - whole euro prices, so totals are said cleanly ("49 euros")
 *
 * "spoken" holds singular/plural forms used to build the sentence the agent
 * reads, e.g. "two ceramic mugs and one wool blanket".
 * "gender" is the French grammatical gender, used for "un" / "une".
 *
 * "options" (furniture only): each value adds "delta" euros to the base "price" (keep it a
 * multiple of 10 so a 10 percent discount stays a whole number), carries a "spoken" phrase
 * appended to the item in the agent's cart sentence ("pre" goes before the noun instead),
 * and may carry a "lead" time. "artFor"
 * redraws the picture for the chosen values.
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

  // Furniture art, redrawn for the chosen wood / fabric.
  const tableArt = (w) => svg("#ECE6DD", `
      <ellipse cx="200" cy="304" rx="150" ry="12" fill="#000" opacity=".08"/>
      <path d="M106 186h12l-4 96h-5z" fill="${w[2]}"/>
      <path d="M282 186h12l-3 96h-5z" fill="${w[2]}"/>
      <path d="M64 158l28-22h216l28 22z" fill="${w[0]}"/>
      <rect x="64" y="158" width="272" height="16" fill="${w[1]}"/>
      <rect x="82" y="174" width="236" height="12" fill="${w[2]}" opacity=".85"/>
      <path d="M84 174h18l-5 128h-8z" fill="${w[1]}"/>
      <path d="M298 174h18l-4 128h-8z" fill="${w[1]}"/>
      <path d="M120 144h160M108 151h184" stroke="#fff" stroke-width="2" opacity=".18"/>
      <ellipse cx="200" cy="140" rx="26" ry="5" fill="#000" opacity=".06"/>
      <path d="M190 116h20l-3 22h-14z" fill="#F4EFE6"/>
      <path d="M200 116c-10-22 6-34 18-36-8 10-10 22-14 36z" fill="#7E9572"/>`);

  const chairArt = (f, l) => svg("#EDE7DF", `
      <ellipse cx="200" cy="322" rx="122" ry="12" fill="#000" opacity=".08"/>
      <path d="M134 276h10l-3 40h-6z" fill="${l[1]}"/>
      <path d="M256 276h10l-2 40h-6z" fill="${l[1]}"/>
      <path d="M116 270h14l-4 48h-7z" fill="${l[0]}"/>
      <path d="M270 270h14l-3 48h-7z" fill="${l[0]}"/>
      <path d="M118 120c0-22 22-34 82-34s82 12 82 34v130H118z" fill="${f[2]}"/>
      <rect x="134" y="112" width="132" height="116" rx="30" fill="${f[1]}"/>
      <rect x="108" y="226" width="184" height="50" rx="16" fill="${f[2]}"/>
      <rect x="128" y="208" width="144" height="36" rx="14" fill="${f[0]}"/>
      <rect x="90" y="168" width="42" height="108" rx="20" fill="${f[1]}"/>
      <rect x="268" y="168" width="42" height="108" rx="20" fill="${f[1]}"/>
      <path d="M96 182h30M274 182h30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".16"/>`);

  // [top, front, legs] for each wood, [light, mid, dark] for each fabric, [front, back] for legs
  const WOOD = { oak: ["#E2C79C", "#C9A273", "#B08A5C"], smoked: ["#8E6C4E", "#73553D", "#5E4431"], walnut: ["#7C513A", "#61402C", "#4D3122"] };
  const FABRIC = { sage: ["#AEBB9D", "#94A585", "#7C8C6D"], terracotta: ["#D08A66", "#BB6E4B", "#9F5A3B"],
    midnight: ["#56688C", "#3F5074", "#33415F"], ivory: ["#F6F1E7", "#ECE4D6", "#DDD3C2"] };
  const LEGS = { oak: ["#C9A273", "#A9875E"], black: ["#2F2B28", "#211E1C"] };

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
      id: "table", price: 1890, gender: "f",
      art: tableArt(WOOD.oak), artFor: (v) => tableArt(WOOD[v.wood] || WOOD.oak),
      name: { en: "Solid Wood Dining Table", fr: "Table à manger en bois massif" },
      spoken: { en: ["dining table", "dining tables"], fr: ["table à manger", "tables à manger"] },
      short: {
        en: "A made-to-order table in solid oak or walnut, for 6 or 8 people.",
        fr: "Une table fabriquée à la commande en chêne ou noyer massif, pour 6 ou 8 personnes."
      },
      options: [
        { key: "wood", name: { en: "Wood", fr: "Bois" }, values: [
          { id: "oak", swatch: "#C9A273", delta: 0, name: { en: "Natural oak", fr: "Chêne naturel" },
            spoken: { en: "in natural solid oak", fr: "en chêne massif naturel" },
            lead: { en: "Made to order: ships in 6 to 8 weeks", fr: "Fabriquée à la commande : expédiée sous 6 à 8 semaines" } },
          { id: "smoked", swatch: "#73553D", delta: 150, name: { en: "Smoked oak", fr: "Chêne fumé" },
            spoken: { en: "in smoked solid oak", fr: "en chêne massif fumé" },
            lead: { en: "Made to order: ships in 6 to 8 weeks", fr: "Fabriquée à la commande : expédiée sous 6 à 8 semaines" } },
          { id: "walnut", swatch: "#61402C", delta: 500, name: { en: "Walnut", fr: "Noyer" },
            spoken: { en: "in solid walnut", fr: "en noyer massif" },
            lead: { en: "Made to order: ships in 8 to 10 weeks", fr: "Fabriquée à la commande : expédiée sous 8 à 10 semaines" } }
        ] },
        { key: "size", name: { en: "Size", fr: "Dimensions" }, values: [
          { id: "180", delta: 0, name: { en: "180 × 90 cm · seats 6", fr: "180 × 90 cm · 6 personnes" },
            pre: { en: "180 centimetre" }, spoken: { en: "", fr: "de 180 centimètres" } },
          { id: "220", delta: 400, name: { en: "220 × 100 cm · seats 8", fr: "220 × 100 cm · 8 personnes" },
            pre: { en: "220 centimetre" }, spoken: { en: "", fr: "de 220 centimètres" } }
        ] }
      ],
      description: {
        en: [
          "A dining table built to last for generations, made to order in our partner workshop in the Jura mountains in France. The top is made of solid wood boards 4 cm thick, joined edge to edge and finished by hand, with softly rounded edges and four tapered legs.",
          "Choose natural oak for a light honey tone, smoked oak, darkened all the way through by a traditional fuming process rather than a stain, or American black walnut for a deep chocolate brown. Every table is unique: the grain, knots and colour vary from one board to the next.",
          "The matte hard-wax oil finish is food safe and easy to repair, as light scratches can be sanded and re-oiled. Our two-person delivery team carries it to the room of your choice and bolts on the legs for you. Chairs are not included."
        ],
        fr: [
          "Une table conçue pour traverser les générations, fabriquée à la commande dans notre atelier partenaire du Jura. Le plateau est composé de planches de bois massif de 4 cm d'épaisseur, assemblées à chant et finies à la main, avec des bords adoucis et quatre pieds fuselés.",
          "Choisissez le chêne naturel pour une teinte miel lumineuse, le chêne fumé, foncé dans toute son épaisseur par un fumage traditionnel et non par une teinture, ou le noyer noir d'Amérique pour un brun chocolat profond. Chaque table est unique : le fil du bois, les nœuds et la couleur varient d'une planche à l'autre.",
          "La finition à l'huile-cire mate est compatible avec le contact alimentaire et facile à rénover : les rayures légères se poncent et se huilent à nouveau. Nos deux livreurs l'installent dans la pièce de votre choix et fixent les pieds pour vous. Chaises non incluses."
        ]
      },
      details: {
        en: [
          ["Wood", "Solid European oak (natural or smoked), or solid American black walnut"],
          ["Sizes", "180 × 90 cm (seats 6) or 220 × 100 cm (seats 8)"],
          ["Height", "75 cm, with 66 cm of knee room under the frame"],
          ["Tabletop", "Solid boards, 4 cm thick"],
          ["Weight", "180 cm: 52 kg in oak, 46 kg in walnut · 220 cm: 68 kg in oak, 60 kg in walnut"],
          ["Finish", "Matte hard-wax oil, food safe"],
          ["Assembly", "Legs bolt on. Our delivery team assembles it for free"],
          ["Care", "Wipe with a damp cloth. Re-oil once a year with the care kit included"],
          ["Lead time", "Made to order: 6 to 8 weeks in oak, 8 to 10 weeks in walnut"],
          ["Made in", "France (Jura)"],
          ["Warranty", "10 years"]
        ],
        fr: [
          ["Bois", "Chêne massif européen (naturel ou fumé), ou noyer noir d'Amérique massif"],
          ["Dimensions", "180 × 90 cm (6 personnes) ou 220 × 100 cm (8 personnes)"],
          ["Hauteur", "75 cm, dont 66 cm de passage pour les jambes sous la ceinture"],
          ["Plateau", "Planches massives de 4 cm d'épaisseur"],
          ["Poids", "180 cm : 52 kg en chêne, 46 kg en noyer · 220 cm : 68 kg en chêne, 60 kg en noyer"],
          ["Finition", "Huile-cire mate, contact alimentaire"],
          ["Montage", "Pieds vissés. Montage offert par nos livreurs"],
          ["Entretien", "Un chiffon humide. Huiler une fois par an avec le kit d'entretien fourni"],
          ["Délai", "Fabriquée à la commande : 6 à 8 semaines en chêne, 8 à 10 semaines en noyer"],
          ["Fabrication", "France (Jura)"],
          ["Garantie", "10 ans"]
        ]
      }
    },
    {
      id: "armchair", price: 1290, gender: "m",
      art: chairArt(FABRIC.sage, LEGS.oak), artFor: (v) => chairArt(FABRIC[v.fabric] || FABRIC.sage, LEGS[v.legs] || LEGS.oak),
      name: { en: "Lounge Armchair", fr: "Fauteuil de salon" },
      spoken: { en: ["lounge armchair", "lounge armchairs"], fr: ["fauteuil de salon", "fauteuils de salon"] },
      short: {
        en: "A deep armchair in cotton velvet or wool bouclé, on solid oak legs.",
        fr: "Un fauteuil profond en velours de coton ou bouclette de laine, sur pieds en chêne massif."
      },
      options: [
        { key: "fabric", name: { en: "Fabric", fr: "Tissu" }, values: [
          { id: "sage", swatch: "#94A585", delta: 0, name: { en: "Sage green velvet", fr: "Velours vert sauge" },
            spoken: { en: "in sage green velvet", fr: "en velours vert sauge" },
            lead: { en: "In stock: ships in 1 to 2 weeks", fr: "En stock : expédié sous 1 à 2 semaines" } },
          { id: "terracotta", swatch: "#BB6E4B", delta: 0, name: { en: "Terracotta velvet", fr: "Velours terracotta" },
            spoken: { en: "in terracotta velvet", fr: "en velours terracotta" },
            lead: { en: "Made to order: ships in 4 to 5 weeks", fr: "Fabriqué à la commande : expédié sous 4 à 5 semaines" } },
          { id: "midnight", swatch: "#3F5074", delta: 0, name: { en: "Midnight blue velvet", fr: "Velours bleu nuit" },
            spoken: { en: "in midnight blue velvet", fr: "en velours bleu nuit" },
            lead: { en: "Made to order: ships in 4 to 5 weeks", fr: "Fabriqué à la commande : expédié sous 4 à 5 semaines" } },
          { id: "ivory", swatch: "#ECE4D6", delta: 100, name: { en: "Ivory wool bouclé", fr: "Bouclette de laine ivoire" },
            spoken: { en: "in ivory wool bouclé", fr: "en bouclette de laine ivoire" },
            lead: { en: "In stock: ships in 1 to 2 weeks", fr: "En stock : expédié sous 1 à 2 semaines" } }
        ] },
        { key: "legs", name: { en: "Legs", fr: "Pieds" }, values: [
          { id: "oak", swatch: "#C9A273", delta: 0, name: { en: "Natural oak", fr: "Chêne naturel" },
            spoken: { en: "with natural oak legs", fr: "avec pieds en chêne naturel" } },
          { id: "black", swatch: "#2F2B28", delta: 0, name: { en: "Black-stained oak", fr: "Chêne teinté noir" },
            spoken: { en: "with black oak legs", fr: "avec pieds en chêne noir" } }
        ] }
      ],
      description: {
        en: [
          "A deep, generous armchair with a gently curved back and wide arms, made for long evenings with a book. The solid beech frame is built to last, the seat combines pocket springs with high-resilience foam so it keeps its shape, and the loose back cushion is filled with a soft mix of feather and fibre.",
          "Choose a cotton velvet in sage green, terracotta or midnight blue, or an ivory wool bouclé with a soft looped texture. The legs are solid oak, natural or stained black. If you have a cat or a dog, we recommend velvet, as claws can catch in the bouclé loops.",
          "It arrives fully assembled: just screw on the four legs by hand, no tools needed. Our two-person delivery team carries it to the room of your choice."
        ],
        fr: [
          "Un fauteuil profond et généreux, au dossier légèrement arrondi et aux larges accoudoirs, pensé pour les longues soirées de lecture. La structure en hêtre massif est faite pour durer, l'assise associe ressorts ensachés et mousse haute résilience pour garder sa forme, et le coussin de dossier amovible est garni d'un doux mélange de plumes et de fibres.",
          "Choisissez un velours de coton vert sauge, terracotta ou bleu nuit, ou une bouclette de laine ivoire à la texture moelleuse. Les pieds sont en chêne massif, naturel ou teinté noir. Si vous avez un chat ou un chien, nous conseillons le velours : les griffes peuvent accrocher les boucles de la bouclette.",
          "Il est livré entièrement monté : il suffit de visser les quatre pieds à la main, sans outil. Nos deux livreurs l'installent dans la pièce de votre choix."
        ]
      },
      details: {
        en: [
          ["Fabric", "Cotton velvet (88% cotton, 12% polyester) or wool bouclé (65% wool, 35% polyamide)"],
          ["Legs", "Solid oak, natural or black-stained"],
          ["Dimensions", "78 cm wide, 84 cm deep, 76 cm high"],
          ["Seat", "42 cm high, 55 cm deep. Arms 58 cm high"],
          ["Weight", "24 kg. Supports up to 130 kg"],
          ["Frame", "Kiln-dried solid beech"],
          ["Filling", "Pocket springs and high-resilience foam. Back cushion in feather and fibre"],
          ["Assembly", "Arrives assembled. Screw on the 4 legs by hand"],
          ["Care", "Covers are not removable. Spot clean with a damp cloth"],
          ["Lead time", "Sage green and ivory: in stock, 1 to 2 weeks. Terracotta and midnight blue: made to order, 4 to 5 weeks"],
          ["Made in", "Portugal"],
          ["Warranty", "10 years on the frame, 2 years on fabric and cushions"]
        ],
        fr: [
          ["Tissu", "Velours de coton (88 % coton, 12 % polyester) ou bouclette de laine (65 % laine, 35 % polyamide)"],
          ["Pieds", "Chêne massif, naturel ou teinté noir"],
          ["Dimensions", "78 cm de large, 84 cm de profondeur, 76 cm de haut"],
          ["Assise", "42 cm de haut, 55 cm de profondeur. Accoudoirs à 58 cm"],
          ["Poids", "24 kg. Supporte jusqu'à 130 kg"],
          ["Structure", "Hêtre massif séché au four"],
          ["Garnissage", "Ressorts ensachés et mousse haute résilience. Coussin de dossier plumes et fibres"],
          ["Montage", "Livré monté. Vissez les 4 pieds à la main"],
          ["Entretien", "Housses non déhoussables. Détachez avec un chiffon humide"],
          ["Délai", "Vert sauge et ivoire : en stock, 1 à 2 semaines. Terracotta et bleu nuit : fabriqué à la commande, 4 à 5 semaines"],
          ["Fabrication", "Portugal"],
          ["Garantie", "10 ans sur la structure, 2 ans sur le tissu et les coussins"]
        ]
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

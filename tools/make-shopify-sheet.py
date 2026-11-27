#!/usr/bin/env python3
"""
Build the Shopify product sheet from one source of truth (the data below, which mirrors
assets/catalog.js and docs/kb-delivery.md):

    python3 tools/make-shopify-sheet.py

Writes shopify/products.md (copy-paste sheet, EN + FR) and shopify/products_import.csv
(Shopify Admin > Products > Import). Edit the data here, not the generated files.
"""
import csv, html, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_BASE = "https://mahmoudghanem-cmyk.github.io/maison-claire-demo/shopify/images/"
VENDOR = "Maison Claire"

DELIVERY = {
    "en": "Ships within 1 to 2 business days. Free delivery from 50 €, otherwise 5 €. Free returns within 30 days.",
    "fr": "Expédié sous 1 à 2 jours ouvrés. Livraison offerte dès 50 €, sinon 5 €. Retours gratuits sous 30 jours.",
}

COLLECTIONS = {
    "kitchen": ("Kitchen & Table", "Cuisine et table"),
    "home": ("Home & Living", "Maison et déco"),
    "bath": ("Bath", "Salle de bain"),
    "everyday": ("Everyday Essentials", "Essentiels du quotidien"),
    "gifts30": ("Gifts under 30 €", "Cadeaux à moins de 30 €"),
}

P = [
    dict(
        id="mug", handle="ceramic-mug", sku="MC-MUG-350-WHT", price=18, cost=6.00, qty=120,
        grams=550, origin="Portugal", hs="6912.00", type=("Mugs", "Tasses"),
        category=("Mugs", "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs"),
        collections=["kitchen", "gifts30"],
        tags="ceramic, stoneware, kitchen, dishwasher safe, gift under 30",
        title=("Ceramic Mug", "Tasse en céramique"),
        short=("A generous everyday mug in soft white stoneware.",
               "Une grande tasse du quotidien en grès blanc."),
        body=("Glazed stoneware with a smooth, comfortable handle. Holds a large coffee or tea. Microwave and dishwasher safe.",
              "Grès émaillé avec une anse douce et confortable. Parfaite pour un grand café ou un thé. Compatible micro-ondes et lave-vaisselle."),
        details=([("Material", "Stoneware ceramic"), ("Capacity", "350 ml"), ("Colour", "White"), ("Care", "Dishwasher and microwave safe")],
                 [("Matière", "Grès céramique"), ("Contenance", "350 ml"), ("Couleur", "Blanc"), ("Entretien", "Lave-vaisselle et micro-ondes")]),
        seo=(("Ceramic Mug 350 ml, White Stoneware | Maison Claire",
              "A large white stoneware mug for coffee or tea, 350 ml. Microwave and dishwasher safe. Free delivery from 50 €."),
             ("Tasse en céramique 350 ml, grès blanc | Maison Claire",
              "Une grande tasse en grès blanc pour le café ou le thé, 350 ml. Micro-ondes et lave-vaisselle. Livraison offerte dès 50 €.")),
        alt=("White stoneware ceramic mug filled with coffee", "Tasse en grès blanc remplie de café"),
    ),
    dict(
        id="candle", handle="vanilla-scented-candle", sku="MC-CND-200-VAN", price=24, cost=8.00, qty=80,
        grams=450, origin="France", hs="3406.00", type=("Candles", "Bougies"),
        category=("Candles", "Home & Garden > Decor > Home Fragrances > Candles"),
        collections=["home", "gifts30"],
        tags="candle, vanilla, soy wax, home fragrance, gift under 30",
        title=("Vanilla Scented Candle", "Bougie parfumée à la vanille"),
        short=("A warm vanilla candle in an amber glass jar.",
               "Une bougie à la vanille dans un pot en verre ambré."),
        body=("Natural soy wax and a cotton wick for a clean, slow burn. A gentle vanilla scent that fills a room without being overpowering.",
              "Cire de soja naturelle et mèche en coton pour une combustion lente et propre. Un doux parfum de vanille qui embaume la pièce sans être trop fort."),
        details=([("Wax", "Soy wax, cotton wick"), ("Burn time", "About 40 hours"), ("Weight", "200 g"), ("Scent", "Vanilla"), ("Jar", "Amber glass")],
                 [("Cire", "Cire de soja, mèche en coton"), ("Durée", "Environ 40 heures"), ("Poids", "200 g"), ("Parfum", "Vanille"), ("Pot", "Verre ambré")]),
        seo=(("Vanilla Scented Soy Candle, 40 Hours | Maison Claire",
              "Soy wax vanilla candle in an amber glass jar, about 40 hours of burn time. A gentle scent for the whole room."),
             ("Bougie parfumée vanille, cire de soja, 40 h | Maison Claire",
              "Bougie à la vanille en cire de soja dans un pot en verre ambré, environ 40 heures de combustion. Un parfum doux pour toute la pièce.")),
        alt=("Vanilla candle in an amber glass jar, lit", "Bougie à la vanille allumée dans un pot en verre ambré"),
    ),
    dict(
        id="blanket", handle="wool-blanket", sku="MC-BLK-130170-BEI", price=79, cost=31.00, qty=25,
        grams=1200, origin="Portugal", hs="6301.20", type=("Blankets", "Plaids"),
        category=("Blankets", "Home & Garden > Linens & Bedding > Bedding > Blankets"),
        collections=["home"],
        tags="wool, blanket, throw, living room, bedroom",
        title=("Wool Blanket", "Plaid en laine"),
        short=("A soft, warm blanket for the sofa or the bed.",
               "Un plaid doux et chaud pour le canapé ou le lit."),
        body=("Woven from pure wool in a natural beige colour, with a simple stripe and fringed edges. Warm in winter, breathable all year.",
              "Tissé en pure laine beige naturel, avec une rayure simple et des franges. Chaud en hiver, respirant toute l'année."),
        details=([("Material", "100% wool"), ("Size", "130 × 170 cm"), ("Colour", "Natural beige"), ("Care", "Hand wash cold")],
                 [("Matière", "100 % laine"), ("Dimensions", "130 × 170 cm"), ("Couleur", "Beige naturel"), ("Entretien", "Lavage à la main à froid")]),
        seo=(("Pure Wool Blanket 130 × 170 cm, Natural Beige | Maison Claire",
              "A soft, warm pure wool blanket with fringed edges, 130 × 170 cm, for the sofa or the bed. Free delivery from 50 €."),
             ("Plaid en pure laine 130 × 170 cm, beige naturel | Maison Claire",
              "Un plaid doux et chaud en pure laine avec franges, 130 × 170 cm, pour le canapé ou le lit. Livraison offerte dès 50 €.")),
        alt=("Folded natural beige wool blanket with a stripe", "Plaid en laine beige naturel plié, avec une rayure"),
    ),
    dict(
        id="bottle", handle="insulated-bottle", sku="MC-BTL-500-BLU", price=29, cost=11.00, qty=60,
        grams=450, origin="China", hs="9617.00", type=("Water bottles", "Gourdes"),
        category=("Water Bottles", "Home & Garden > Kitchen & Dining > Food & Beverage Carriers > Water Bottles"),
        collections=["kitchen", "gifts30"],
        tags="bottle, stainless steel, insulated, on the go, gift under 30",
        title=("Insulated Bottle", "Gourde isotherme"),
        short=("Keeps drinks cold for 24 hours or hot for 12.",
               "Garde vos boissons froides 24 h ou chaudes 12 h."),
        body=("Double wall stainless steel with a leak proof cap and a carry loop. Fits most cup holders.",
              "Acier inoxydable double paroi, bouchon étanche et anse de transport. Se glisse dans la plupart des porte-gobelets."),
        details=([("Material", "Double wall stainless steel"), ("Capacity", "500 ml"), ("Colour", "Slate blue"), ("Keeps", "Cold 24 h, hot 12 h"), ("Care", "Hand wash")],
                 [("Matière", "Acier inoxydable double paroi"), ("Contenance", "500 ml"), ("Couleur", "Bleu ardoise"), ("Conservation", "Froid 24 h, chaud 12 h"), ("Entretien", "Lavage à la main")]),
        seo=(("Insulated Stainless Steel Bottle 500 ml | Maison Claire",
              "Leak proof 500 ml stainless steel bottle in slate blue. Keeps drinks cold for 24 hours or hot for 12."),
             ("Gourde isotherme inox 500 ml, bleu ardoise | Maison Claire",
              "Gourde étanche en acier inoxydable 500 ml, bleu ardoise. Garde vos boissons froides 24 h ou chaudes 12 h.")),
        alt=("Slate blue insulated stainless steel bottle", "Gourde isotherme en acier inoxydable bleu ardoise"),
    ),
    dict(
        id="tote", handle="cotton-tote-bag", sku="MC-TOT-3842-NAT", price=15, cost=4.50, qty=150,
        grams=250, origin="India", hs="4202.92", type=("Tote bags", "Sacs cabas"),
        category=("Shopping Totes", "Luggage & Bags > Shopping Totes"),
        collections=["everyday", "gifts30"],
        tags="tote bag, organic cotton, everyday, gift under 30",
        title=("Cotton Tote Bag", "Sac cabas en coton"),
        short=("A sturdy everyday bag in organic cotton.",
               "Un sac robuste du quotidien en coton bio."),
        body=("Thick organic cotton canvas with long handles to wear on the shoulder, and an inside pocket for keys and phone.",
              "Toile de coton bio épaisse, longues anses pour le porter à l'épaule et poche intérieure pour les clés et le téléphone."),
        details=([("Material", "Organic cotton canvas"), ("Size", "38 × 42 cm"), ("Colour", "Natural"), ("Care", "Machine wash 30 °C")],
                 [("Matière", "Toile de coton bio"), ("Dimensions", "38 × 42 cm"), ("Couleur", "Écru"), ("Entretien", "Machine à 30 °C")]),
        seo=(("Organic Cotton Tote Bag 38 × 42 cm | Maison Claire",
              "A sturdy organic cotton tote with long shoulder handles and an inside pocket for keys and phone."),
             ("Sac cabas en coton bio 38 × 42 cm | Maison Claire",
              "Un sac cabas robuste en coton bio, longues anses d'épaule et poche intérieure pour les clés et le téléphone.")),
        alt=("Natural organic cotton tote bag with long handles", "Sac cabas en coton bio écru à longues anses"),
    ),
    dict(
        id="notebook", handle="paper-notebook", sku="MC-NTB-A5-SGE", price=12, cost=3.80, qty=200,
        grams=350, origin="France", hs="4820.10", type=("Notebooks", "Carnets"),
        category=("Notebooks & Notepads", "Office Supplies > General Office Supplies > Paper Products > Notebooks & Notepads"),
        collections=["everyday", "gifts30"],
        tags="notebook, A5, recycled paper, stationery, gift under 30",
        title=("Paper Notebook", "Carnet de notes"),
        short=("A5 notebook with dotted pages and a linen cover.",
               "Carnet A5 à pages pointillées et couverture en lin."),
        body=("160 pages of thick recycled paper that lies flat when open, with an elastic band to keep it closed.",
              "160 pages en papier recyclé épais qui reste bien à plat une fois ouvert, avec un élastique de fermeture."),
        details=([("Format", "A5"), ("Pages", "160 dotted pages"), ("Paper", "Thick recycled paper"), ("Cover", "Sage green linen, elastic closure")],
                 [("Format", "A5"), ("Pages", "160 pages pointillées"), ("Papier", "Papier recyclé épais"), ("Couverture", "Lin vert sauge, élastique de fermeture")]),
        seo=(("A5 Dotted Notebook, Recycled Paper, Linen Cover | Maison Claire",
              "A5 notebook with 160 dotted pages of thick recycled paper, a sage green linen cover and an elastic closure."),
             ("Carnet A5 pointillé, papier recyclé, couverture lin | Maison Claire",
              "Carnet A5 de 160 pages pointillées en papier recyclé épais, couverture en lin vert sauge et élastique de fermeture.")),
        alt=("Sage green linen A5 notebook with an elastic band", "Carnet A5 en lin vert sauge avec élastique"),
    ),
    dict(
        id="towel", handle="cotton-bath-towel", sku="MC-TWL-70140-WHT", price=25, cost=9.00, qty=70,
        grams=650, origin="Portugal", hs="6302.60", type=("Bath towels", "Serviettes de bain"),
        category=("Bath Towels & Washcloths", "Home & Garden > Linens & Bedding > Towels > Bath Towels & Washcloths"),
        collections=["bath", "gifts30"],
        tags="towel, cotton, bathroom, gift under 30",
        title=("Cotton Bath Towel", "Serviette de bain en coton"),
        short=("A thick, absorbent towel in soft white cotton.",
               "Une serviette épaisse et absorbante en coton blanc."),
        body=("Heavy cotton that gets softer with every wash. Large enough to wrap around you after a shower.",
              "Un coton épais qui devient plus doux à chaque lavage. Assez grande pour s'envelopper après la douche."),
        details=([("Material", "100% cotton"), ("Size", "70 × 140 cm"), ("Colour", "White"), ("Care", "Machine wash 40 °C")],
                 [("Matière", "100 % coton"), ("Dimensions", "70 × 140 cm"), ("Couleur", "Blanc"), ("Entretien", "Machine à 40 °C")]),
        seo=(("White Cotton Bath Towel 70 × 140 cm | Maison Claire",
              "A thick, absorbent 100% cotton bath towel, 70 × 140 cm, that gets softer with every wash."),
             ("Serviette de bain en coton blanc 70 × 140 cm | Maison Claire",
              "Une serviette de bain épaisse et absorbante, 100 % coton, 70 × 140 cm, plus douce à chaque lavage.")),
        alt=("Folded white cotton bath towels", "Serviettes de bain en coton blanc pliées"),
    ),
    dict(
        id="lamp", handle="table-lamp", sku="MC-LMP-40-TER", price=69, cost=26.00, qty=15,
        grams=2600, origin="Portugal", hs="9405.21", type=("Lamps", "Lampes"),
        category=("Lamps", "Home & Garden > Lighting > Lamps"),
        collections=["home"],
        tags="lamp, ceramic, linen, lighting, living room",
        title=("Table Lamp", "Lampe de table"),
        short=("A ceramic lamp with a linen shade for soft, warm light.",
               "Une lampe en céramique avec abat-jour en lin pour une lumière douce."),
        body=("Terracotta ceramic base and natural linen shade. Comes with an LED bulb and an on and off switch on the cable.",
              "Pied en céramique terracotta et abat-jour en lin naturel. Livrée avec une ampoule LED et un interrupteur sur le câble."),
        details=([("Material", "Ceramic base, linen shade"), ("Height", "40 cm"), ("Bulb", "LED bulb included"), ("Switch", "On and off switch on the cable"), ("Colour", "Terracotta")],
                 [("Matière", "Pied en céramique, abat-jour en lin"), ("Hauteur", "40 cm"), ("Ampoule", "Ampoule LED incluse"), ("Interrupteur", "Sur le câble"), ("Couleur", "Terracotta")]),
        seo=(("Terracotta Ceramic Table Lamp, Linen Shade | Maison Claire",
              "A 40 cm terracotta ceramic table lamp with a natural linen shade. LED bulb included. Free delivery from 50 €."),
             ("Lampe de table céramique terracotta, abat-jour lin | Maison Claire",
              "Lampe de table de 40 cm en céramique terracotta avec abat-jour en lin naturel. Ampoule LED incluse. Livraison offerte dès 50 €.")),
        alt=("Terracotta ceramic table lamp with a linen shade", "Lampe de table en céramique terracotta avec abat-jour en lin"),
    ),
]

# Long-form copy for Shopify (richer than the demo store's cards, never contradicting them).
# paras: description paragraphs; details: the "Details" list. Same order in EN and FR.
TEXT = {
    "mug": {
        "en": dict(paras=[
            "A generous everyday mug in soft white stoneware.",
            "Made from glazed stoneware, a dense ceramic fired at high temperature, it is sturdy, keeps your drink warm for longer and resists chips better than ordinary earthenware. The smooth, rounded handle leaves room for three fingers, and the slightly thicker rim feels pleasant against the lips.",
            "At 350 ml it holds a large coffee, a tea or a hot chocolate. The satin white glaze is free of lead and cadmium, and the mug goes straight into the microwave and the dishwasher. Each piece is glazed by hand, so small variations in tone are normal and make every mug unique.",
        ], details=[
            ("Material", "Stoneware ceramic, satin glaze (lead and cadmium free)"),
            ("Capacity", "350 ml"),
            ("Dimensions", "10 cm high, 9 cm across (12 cm with the handle)"),
            ("Weight", "380 g"),
            ("Colour", "White"),
            ("Care", "Dishwasher and microwave safe. Not for the oven or the hob."),
            ("Made in", "Portugal"),
            ("Packaging", "Recycled cardboard box"),
        ]),
        "fr": dict(paras=[
            "Une grande tasse du quotidien en grès blanc.",
            "Fabriquée en grès émaillé, une céramique dense cuite à haute température, elle est robuste, garde votre boisson chaude plus longtemps et résiste mieux aux ébréchures que la faïence. Son anse douce et arrondie laisse la place à trois doigts, et son bord légèrement épais est agréable aux lèvres.",
            "Avec ses 350 ml, elle accueille un grand café, un thé ou un chocolat chaud. L'émail blanc satiné est sans plomb ni cadmium, et la tasse passe au micro-ondes comme au lave-vaisselle. Chaque pièce est émaillée à la main : de légères variations de teinte sont normales et rendent chaque tasse unique.",
        ], details=[
            ("Matière", "Grès céramique, émail satiné (sans plomb ni cadmium)"),
            ("Contenance", "350 ml"),
            ("Dimensions", "10 cm de haut, 9 cm de diamètre (12 cm avec l'anse)"),
            ("Poids", "380 g"),
            ("Couleur", "Blanc"),
            ("Entretien", "Lave-vaisselle et micro-ondes. Ne pas utiliser au four ni sur le feu."),
            ("Fabriqué au", "Portugal"),
            ("Emballage", "Boîte en carton recyclé"),
        ]),
    },
    "candle": {
        "en": dict(paras=[
            "A warm vanilla candle in an amber glass jar.",
            "Poured by hand from natural soy wax with a cotton wick, it burns slowly and cleanly, with no paraffin and very little smoke. The scent is a soft, rounded vanilla with a hint of tonka bean: enough to fill a living room without ever being overpowering.",
            "The 200 g of wax give about 40 hours of burning. Once the candle is finished, the amber glass jar can be washed and reused for pens, cotton pads or a small plant.",
            "For the best result, let the wax melt across the whole surface on the first burn (about 2 hours), trim the wick to 5 mm before each use, and never leave a lit candle unattended.",
        ], details=[
            ("Wax", "Natural soy wax, paraffin free, vegan"),
            ("Wick", "Cotton"),
            ("Scent", "Vanilla with a hint of tonka bean"),
            ("Net wax weight", "200 g"),
            ("Burn time", "About 40 hours"),
            ("Jar", "Amber glass, reusable, 8 cm across, 9 cm high"),
            ("Safety", "Burn for 3 hours at most at a time, away from draughts, children and pets"),
            ("Made in", "France"),
        ]),
        "fr": dict(paras=[
            "Une bougie à la vanille dans un pot en verre ambré.",
            "Coulée à la main en cire de soja naturelle avec une mèche en coton, elle brûle lentement et proprement, sans paraffine et avec très peu de fumée. Son parfum est une vanille douce et ronde, avec une pointe de fève tonka : de quoi embaumer un salon sans jamais être trop fort.",
            "Ses 200 g de cire offrent environ 40 heures de combustion. Une fois la bougie terminée, le pot en verre ambré se lave et se réutilise pour des crayons, des cotons ou une petite plante.",
            "Pour un résultat optimal, laissez la cire fondre sur toute la surface lors du premier allumage (environ 2 heures), coupez la mèche à 5 mm avant chaque utilisation et ne laissez jamais une bougie allumée sans surveillance.",
        ], details=[
            ("Cire", "Cire de soja naturelle, sans paraffine, vegan"),
            ("Mèche", "Coton"),
            ("Parfum", "Vanille, pointe de fève tonka"),
            ("Poids net de cire", "200 g"),
            ("Durée de combustion", "Environ 40 heures"),
            ("Pot", "Verre ambré réutilisable, 8 cm de diamètre, 9 cm de haut"),
            ("Sécurité", "3 heures maximum d'affilée, à l'abri des courants d'air, des enfants et des animaux"),
            ("Fabriqué en", "France"),
        ]),
    },
    "blanket": {
        "en": dict(paras=[
            "A soft, warm blanket for the sofa or the bed.",
            "Woven from pure new wool in a natural beige colour, with a simple stripe near one edge and knotted fringes at both ends. The wool is lightly brushed after weaving, which makes it soft to the touch while keeping the natural warmth and texture of the fibre.",
            "Wool regulates temperature on its own: it keeps you warm on winter evenings and stays breathable the rest of the year. Throw it over the sofa, fold it at the foot of the bed or take it along for picnics. A few fibres may come loose during the first uses; this is normal for pure wool and stops quickly.",
        ], details=[
            ("Material", "100% pure new wool"),
            ("Size", "130 × 170 cm (fringes not included)"),
            ("Fringes", "8 cm, knotted, at both short ends"),
            ("Weight", "About 900 g"),
            ("Colour", "Natural beige with a single stripe"),
            ("Care", "Hand wash cold with a wool detergent, dry flat. No tumble dryer. Air it regularly between washes."),
            ("Made in", "Portugal"),
            ("Packaging", "Cotton dust bag"),
        ]),
        "fr": dict(paras=[
            "Un plaid doux et chaud pour le canapé ou le lit.",
            "Tissé en pure laine vierge beige naturel, avec une rayure simple près d'un bord et des franges nouées aux deux extrémités. La laine est légèrement grattée après le tissage, ce qui la rend douce au toucher tout en gardant la chaleur et la texture naturelles de la fibre.",
            "La laine régule naturellement la température : elle vous tient chaud les soirs d'hiver et reste respirante le reste de l'année. Jetez-le sur le canapé, pliez-le au pied du lit ou emportez-le en pique-nique. Quelques fibres peuvent se détacher lors des premières utilisations : c'est normal pour une pure laine et cela cesse rapidement.",
        ], details=[
            ("Matière", "100 % pure laine vierge"),
            ("Dimensions", "130 × 170 cm (hors franges)"),
            ("Franges", "8 cm, nouées, sur les deux petits côtés"),
            ("Poids", "Environ 900 g"),
            ("Couleur", "Beige naturel avec une rayure"),
            ("Entretien", "Lavage à la main à froid avec une lessive spéciale laine, séchage à plat. Pas de sèche-linge. Aérer régulièrement entre deux lavages."),
            ("Fabriqué au", "Portugal"),
            ("Emballage", "Housse en coton"),
        ]),
    },
    "bottle": {
        "en": dict(paras=[
            "Keeps drinks cold for 24 hours or hot for 12.",
            "Its double wall of food-grade stainless steel is vacuum insulated: the outside stays at room temperature, without condensation, whatever you put inside. Iced water stays cold through a whole summer day, and tea or coffee stays hot until the afternoon.",
            "The leak proof screw cap has a built-in carry loop, so you can hang it on a bag or carry it on one finger. At 7 cm across it fits most car and bike cup holders, and the wide opening takes ice cubes and is easy to clean. The slate blue finish is a matte powder coating that does not slip in the hand and resists scratches.",
        ], details=[
            ("Material", "18/8 food-grade stainless steel, double wall, vacuum insulated"),
            ("Cap", "Leak proof screw cap with carry loop, BPA free"),
            ("Capacity", "500 ml"),
            ("Keeps", "Cold 24 hours, hot 12 hours"),
            ("Dimensions", "26 cm high, 7 cm across"),
            ("Weight", "340 g (empty)"),
            ("Colour", "Slate blue, matte powder coating"),
            ("Care", "Hand wash only. Not for the dishwasher, freezer or microwave."),
            ("Made in", "China"),
        ]),
        "fr": dict(paras=[
            "Garde vos boissons froides 24 h ou chaudes 12 h.",
            "Sa double paroi en acier inoxydable alimentaire est isolée sous vide : l'extérieur reste à température ambiante, sans condensation, quelle que soit la boisson. L'eau glacée reste fraîche toute une journée d'été, et le thé ou le café reste chaud jusqu'à l'après-midi.",
            "Le bouchon à visser étanche intègre une anse de transport : accrochez la gourde à un sac ou portez-la d'un doigt. Avec ses 7 cm de diamètre, elle se glisse dans la plupart des porte-gobelets de voiture et de vélo, et son large goulot accepte les glaçons et se nettoie facilement. La finition bleu ardoise est un revêtement mat par poudrage, qui ne glisse pas dans la main et résiste aux rayures.",
        ], details=[
            ("Matière", "Acier inoxydable alimentaire 18/8, double paroi, isolation sous vide"),
            ("Bouchon", "À visser, étanche, avec anse de transport, sans BPA"),
            ("Contenance", "500 ml"),
            ("Conservation", "Froid 24 heures, chaud 12 heures"),
            ("Dimensions", "26 cm de haut, 7 cm de diamètre"),
            ("Poids", "340 g (à vide)"),
            ("Couleur", "Bleu ardoise, revêtement mat par poudrage"),
            ("Entretien", "Lavage à la main uniquement. Pas de lave-vaisselle, de congélateur ni de micro-ondes."),
            ("Fabriqué en", "Chine"),
        ]),
    },
    "tote": {
        "en": dict(paras=[
            "A sturdy everyday bag in organic cotton.",
            "Cut from a thick organic cotton canvas, it keeps its shape and carries up to 10 kg: groceries, a laptop, a change of clothes or a day at the beach. The long handles are made to be worn on the shoulder, even over a winter coat.",
            "Inside, a flat pocket keeps your keys and phone within reach instead of at the bottom of the bag. The undyed natural canvas softens and gets more character with use, and the bag folds flat to slip into another bag or a drawer.",
        ], details=[
            ("Material", "100% organic cotton canvas, 340 g/m², undyed"),
            ("Size", "38 × 42 cm"),
            ("Handles", "65 cm long, to wear on the shoulder"),
            ("Inside", "One flat pocket for keys and phone"),
            ("Carries", "Up to 10 kg"),
            ("Colour", "Natural (undyed)"),
            ("Care", "Machine wash 30 °C, inside out. Line dry. May shrink slightly at the first wash."),
            ("Made in", "India"),
        ]),
        "fr": dict(paras=[
            "Un sac robuste du quotidien en coton bio.",
            "Taillé dans une toile de coton bio épaisse, il garde sa forme et porte jusqu'à 10 kg : courses, ordinateur portable, tenue de rechange ou journée à la plage. Ses longues anses se portent à l'épaule, même par-dessus un manteau d'hiver.",
            "À l'intérieur, une poche plate garde vos clés et votre téléphone à portée de main plutôt qu'au fond du sac. La toile écrue non teinte s'assouplit et prend du caractère avec le temps, et le sac se plie à plat pour se glisser dans un autre sac ou un tiroir.",
        ], details=[
            ("Matière", "Toile 100 % coton bio, 340 g/m², non teinte"),
            ("Dimensions", "38 × 42 cm"),
            ("Anses", "65 cm, à porter à l'épaule"),
            ("Intérieur", "Une poche plate pour les clés et le téléphone"),
            ("Charge", "Jusqu'à 10 kg"),
            ("Couleur", "Écru (non teint)"),
            ("Entretien", "Machine à 30 °C, sur l'envers. Séchage à l'air libre. Peut rétrécir légèrement au premier lavage."),
            ("Fabriqué en", "Inde"),
        ]),
    },
    "notebook": {
        "en": dict(paras=[
            "A5 notebook with dotted pages and a linen cover.",
            "Its 160 pages of thick recycled paper have a discreet 5 mm dot grid, as handy for writing as for lists, sketches or bullet journaling. The paper takes most pens, including felt tips and fountain pens, without bleeding through.",
            "The sewn binding lets the notebook lie completely flat when open, so you can write right to the edge of the page. The cover is wrapped in sage green linen, with an elastic band to keep it closed, a ribbon bookmark and a small pocket inside the back cover for loose notes and tickets.",
        ], details=[
            ("Format", "A5 (14.8 × 21 cm)"),
            ("Pages", "160 dotted pages (80 sheets), 5 mm dot grid"),
            ("Paper", "Recycled, 100 g/m², ivory"),
            ("Binding", "Sewn, lies flat when open"),
            ("Cover", "Sage green linen over rigid board"),
            ("Extras", "Elastic closure, ribbon bookmark, pocket inside the back cover"),
            ("Made in", "France"),
        ]),
        "fr": dict(paras=[
            "Carnet A5 à pages pointillées et couverture en lin.",
            "Ses 160 pages en papier recyclé épais portent une grille discrète de points espacés de 5 mm, aussi pratique pour écrire que pour faire des listes, dessiner ou tenir un bullet journal. Le papier accepte la plupart des stylos, y compris les feutres et les stylos plume, sans transpercer.",
            "Sa reliure cousue permet au carnet de rester parfaitement à plat une fois ouvert, pour écrire jusqu'au bord de la page. La couverture est habillée de lin vert sauge, avec un élastique de fermeture, un signet en ruban et une petite poche à l'intérieur du rabat arrière pour les notes volantes et les tickets.",
        ], details=[
            ("Format", "A5 (14,8 × 21 cm)"),
            ("Pages", "160 pages pointillées (80 feuilles), points espacés de 5 mm"),
            ("Papier", "Recyclé, 100 g/m², ivoire"),
            ("Reliure", "Cousue, reste à plat une fois ouvert"),
            ("Couverture", "Lin vert sauge sur carton rigide"),
            ("Plus", "Élastique de fermeture, signet en ruban, poche au dos"),
            ("Fabriqué en", "France"),
        ]),
    },
    "towel": {
        "en": dict(paras=[
            "A thick, absorbent towel in soft white cotton.",
            "Woven from long-staple cotton in a dense 550 g/m² terry, it dries you quickly and gets softer with every wash. At 70 × 140 cm it is large enough to wrap around you after a shower.",
            "Double-stitched hems keep the edges neat wash after wash, and a hanging loop lets you hang it on a hook. Wash it once before the first use: this removes the finishing from the factory and brings out its full absorbency.",
        ], details=[
            ("Material", "100% long-staple cotton terry, 550 g/m²"),
            ("Size", "70 × 140 cm"),
            ("Colour", "White"),
            ("Finish", "Double-stitched hems, hanging loop"),
            ("Care", "Machine wash 40 °C (60 °C possible). Tumble dry low. No fabric softener, which reduces absorbency."),
            ("Made in", "Portugal"),
        ]),
        "fr": dict(paras=[
            "Une serviette épaisse et absorbante en coton blanc.",
            "Tissée en coton à fibres longues dans une éponge dense de 550 g/m², elle sèche rapidement et devient plus douce à chaque lavage. Avec ses 70 × 140 cm, elle est assez grande pour s'envelopper après la douche.",
            "Ses ourlets à double piqûre restent nets lavage après lavage, et une bride permet de la suspendre à une patère. Lavez-la une fois avant la première utilisation : cela retire l'apprêt d'usine et révèle tout son pouvoir absorbant.",
        ], details=[
            ("Matière", "Éponge 100 % coton à fibres longues, 550 g/m²"),
            ("Dimensions", "70 × 140 cm"),
            ("Couleur", "Blanc"),
            ("Finitions", "Ourlets à double piqûre, bride de suspension"),
            ("Entretien", "Machine à 40 °C (60 °C possible). Sèche-linge à basse température. Pas d'adoucissant, qui réduit l'absorption."),
            ("Fabriqué au", "Portugal"),
        ]),
    },
    "lamp": {
        "en": dict(paras=[
            "A ceramic lamp with a linen shade for soft, warm light.",
            "The rounded base is turned in terracotta ceramic and finished with a hand-applied glaze, so each lamp has its own slight variations of colour. The natural linen shade diffuses the light evenly and gives the room a warm, cosy glow.",
            "It comes ready to use, with a warm white LED bulb that uses very little energy, and an on and off switch on the fabric cable. At 40 cm high it suits a bedside table, a sideboard or a desk corner.",
        ], details=[
            ("Material", "Terracotta ceramic base, natural linen shade"),
            ("Height", "40 cm"),
            ("Shade", "28 cm across"),
            ("Bulb", "LED included: E27, 6 W, warm white (2700 K), equal to a 40 W bulb"),
            ("Cable", "1.8 m, fabric covered, with on and off switch"),
            ("Plug", "European plug. UK customers need an adapter."),
            ("Weight", "2.1 kg"),
            ("Care", "Dust the base with a dry cloth and the shade with a soft brush."),
            ("Made in", "Portugal"),
        ]),
        "fr": dict(paras=[
            "Une lampe en céramique avec abat-jour en lin pour une lumière douce.",
            "Son pied arrondi est façonné en céramique terracotta et émaillé à la main : chaque lampe présente ainsi de légères variations de couleur. L'abat-jour en lin naturel diffuse la lumière de façon homogène et donne à la pièce une ambiance chaleureuse.",
            "Elle est livrée prête à l'emploi, avec une ampoule LED blanc chaud très économe et un interrupteur sur le câble textile. Avec ses 40 cm de haut, elle trouve sa place sur une table de chevet, un buffet ou un coin de bureau.",
        ], details=[
            ("Matière", "Pied en céramique terracotta, abat-jour en lin naturel"),
            ("Hauteur", "40 cm"),
            ("Abat-jour", "28 cm de diamètre"),
            ("Ampoule", "LED incluse : E27, 6 W, blanc chaud (2700 K), équivalent 40 W"),
            ("Câble", "1,8 m, gainé de tissu, avec interrupteur"),
            ("Prise", "Prise européenne. Un adaptateur est nécessaire au Royaume-Uni."),
            ("Poids", "2,1 kg"),
            ("Entretien", "Dépoussiérer le pied avec un chiffon sec et l'abat-jour avec une brosse douce."),
            ("Fabriqué au", "Portugal"),
        ]),
    },
}

for _p in P:
    _t = TEXT[_p["id"]]
    _p["paras"] = (_t["en"]["paras"], _t["fr"]["paras"])
    _p["details"] = (_t["en"]["details"], _t["fr"]["details"])


LABEL = {"en": ("Details", "Delivery and returns"), "fr": ("Caractéristiques", "Livraison et retours")}


def body_text(p, i):
    """Plain text description: paragraphs, then the details list, then delivery."""
    lang = "en" if i == 0 else "fr"
    sep = ": " if lang == "en" else " : "
    lines = []
    for para in p["paras"][i]:
        lines += [para, ""]
    lines.append(LABEL[lang][0])
    lines += [f"- {k}{sep}{v}" for k, v in p["details"][i]]
    lines += ["", LABEL[lang][1], DELIVERY[lang]]
    return "\n".join(lines)


def body_html(p, i):
    """Same content as body_text, as HTML for the CSV import (Shopify needs HTML there)."""
    lang = "en" if i == 0 else "fr"
    e = html.escape
    sep = ":" if lang == "en" else " :"
    paras = "".join(f"<p>{e(x)}</p>" for x in p["paras"][i])
    rows = "".join(f"<li><strong>{e(k)}{sep}</strong> {e(v)}</li>" for k, v in p["details"][i])
    return (f"{paras}<h4>{LABEL[lang][0]}</h4><ul>{rows}</ul>"
            f"<h4>{LABEL[lang][1]}</h4><p>{e(DELIVERY[lang])}</p>")


def euro(x):
    return f"{x:.2f}"


def markdown():
    out = []
    w = out.append
    w("# Maison Claire: products for Shopify\n")
    w("Generated by `tools/make-shopify-sheet.py` from the same data as the demo store (`assets/catalog.js`) "
      "and the agent's knowledge base (`docs/kb-delivery.md`), so prices, sizes and delivery promises match what "
      "the voice agent says. Edit the script and re-run it rather than editing this file.\n")
    w("**Two ways to load the products**\n")
    w("- **Fastest:** Shopify Admin → **Products** → **Import** → upload [`products_import.csv`](products_import.csv). "
      "It creates all 8 products in English with price, cost, SKU, stock, weight, tags, SEO and image. "
      "Then add the few fields the CSV can't carry (category, collections, customs, French): see *After the import* below.\n")
    w("- **By hand:** Products → **Add product**, and copy each field from the product cards below. "
      "Descriptions are plain text: paste them straight into the description box (each line becomes its own paragraph).\n")
    w("Prices include VAT (see *Store settings*). Inventory quantities, cost prices, countries of origin and HS codes "
      "are realistic but invented for this demo store.\n")

    w("## Summary\n")
    w("| Product | Handle | SKU | Price | Cost | Stock | Shipping weight |")
    w("| --- | --- | --- | ---: | ---: | ---: | ---: |")
    for p in P:
        w(f"| {p['title'][0]} | `{p['handle']}` | `{p['sku']}` | {p['price']} € | {euro(p['cost'])} € | {p['qty']} | {p['grams'] / 1000:g} kg |")
    w("")

    for n, p in enumerate(P, 1):
        w(f"## {n}. {p['title'][0]} / {p['title'][1]}\n")
        w(f"![{p['alt'][0]}](images/maison-claire-{p['id']}.png)\n")
        w("**Main fields** (Add product page, top to bottom)\n")
        w("| Field | Value |")
        w("| --- | --- |")
        rows = [
            ("Title", p["title"][0]),
            ("Description", "plain text block below"),
            ("Media", f"`shopify/images/maison-claire-{p['id']}.png`, alt text: {p['alt'][0]}"),
            ("Category", f"search **{p['category'][0]}** ({p['category'][1]})"),
            ("Price", f"{p['price']}.00 €"),
            ("Compare-at price", "leave empty (the agent's offer is the MERCI10 code)"),
            ("Charge tax on this product", "Yes"),
            ("Cost per item", f"{euro(p['cost'])} €"),
            ("Track quantity", "Yes"),
            ("Quantity", str(p["qty"])),
            ("Continue selling when out of stock", "No"),
            ("SKU", p["sku"]),
            ("Barcode", "leave empty"),
            ("This is a physical product", "Yes"),
            ("Weight (with packaging)", f"{p['grams'] / 1000:g} kg"),
            ("Country/Region of origin", p["origin"]),
            ("HS code", p["hs"]),
            ("Variants", "none (one version only)"),
            ("Status", "Active"),
            ("Sales channels", "Online Store"),
            ("Type", p["type"][0]),
            ("Vendor", VENDOR),
            ("Collections", ", ".join(COLLECTIONS[c][0] for c in p["collections"])),
            ("Tags", p["tags"]),
            ("Page title (SEO)", p["seo"][0][0]),
            ("Meta description (SEO)", p["seo"][0][1]),
            ("URL handle", p["handle"]),
        ]
        for k, v in rows:
            w(f"| {k} | {v} |")
        w("")
        w("**Description (English)**\n")
        w("```text\n" + body_text(p, 0) + "\n```\n")
        w("**French translation** (Settings → Languages → French → Translate, or the Translate & Adapt app)\n")
        w("| Field | Valeur |")
        w("| --- | --- |")
        w(f"| Title | {p['title'][1]} |")
        w(f"| Page title (SEO) | {p['seo'][1][0]} |")
        w(f"| Meta description (SEO) | {p['seo'][1][1]} |")
        w(f"| Image alt text | {p['alt'][1]} |")
        w(f"| Type | {p['type'][1]} |")
        w("")
        w("**Description (français)**\n")
        w("```text\n" + body_text(p, 1) + "\n```\n")

    w("## After the import\n")
    w("The Shopify CSV has no columns for these, so set them once per product (or in bulk: select the products → **Bulk edit**):\n")
    w("1. **Category**: open each product, type the search word from its card into *Category*.")
    w("2. **Customs**: *Country/Region of origin* and *HS code*, in the Shipping section of each product (needed for the UK and Switzerland).")
    w("3. **Collections**: create these five manual collections (Products → Collections → Create collection), then add the products:\n")
    w("| Collection (EN) | Collection (FR) | Products |")
    w("| --- | --- | --- |")
    for key, (en, fr) in COLLECTIONS.items():
        members = ", ".join(p["title"][0] for p in P if key in p["collections"])
        w(f"| {en} | {fr} | {members} |")
    w("")
    w("4. **French**: paste the French title, description and SEO fields from each card.\n")

    w("## Shipping (Settings → Shipping and delivery)\n")
    w("These rates match the agent's knowledge base: dispatch in 1 to 2 business days, 5 € delivery, free from 50 €, "
      "tracked standard delivery only.\n")
    w("In **General shipping rates**, create three zones. Give each zone the same two rates "
      "(*Add rate* → *Use flat rate*, then *Custom delivery description*):\n")
    w("| Zone | Countries | Rate 1 (orders under 50 €) | Rate 2 (orders from 50 €) | Delivery description |")
    w("| --- | --- | --- | --- | --- |")
    w("| France | France (mainland and Corsica) | Standard tracked delivery: 5.00 €, condition *Based on order price* max 49.99 € | Free standard delivery: 0.00 €, condition min 50.00 € | 3 to 6 business days (Corsica 5 to 8) |")
    w("| Europe | Belgium, Luxembourg, Germany, Netherlands, Spain, Italy, Ireland | same | same | 4 to 7 business days |")
    w("| UK and Switzerland | United Kingdom, Switzerland | same | same | 5 to 8 business days. Import taxes may be charged on delivery |")
    w("")
    w("French rate names: *Livraison standard suivie* / *Livraison offerte*. Delivery descriptions: "
      "*3 à 6 jours ouvrés (Corse : 5 à 8)*, *4 à 7 jours ouvrés*, *5 à 8 jours ouvrés. Des taxes d'importation peuvent être demandées à la livraison.*\n")
    w("Don't add the French overseas territories (Guadeloupe, Martinique, Réunion…): the store doesn't deliver there.\n")
    w("**Packages** (Shipping and delivery → Packages): set a default box of 30 × 25 × 15 cm, and add a large box of "
      "45 × 35 × 35 cm for the lamp. Product weights above already include packaging.\n")
    w("**Shipping policy** (Settings → Policies → Shipping policy):\n")
    w("```text\nOrders leave our warehouse within 1 to 2 business days. Delivery times from order to door: mainland France 3 to 6 business days; Belgium, Luxembourg, Germany, the Netherlands, Spain, Italy and Ireland 4 to 7 business days; United Kingdom and Switzerland 5 to 8 business days (local import taxes may be charged on delivery); Corsica 5 to 8 business days. We do not deliver to the French overseas territories yet.\n\nDelivery is free from 50 euros, otherwise 5 euros. All orders go by tracked standard delivery; you receive an email and a text message with a tracking link when your parcel leaves. If you are not home, the carrier leaves your parcel at a nearby pickup point for 10 days.\n\nDuring busy periods (late November to Christmas, sales) please allow 1 to 2 extra business days. If your parcel is more than 3 business days late, contact us through the contact form: we will investigate with the carrier and send a replacement or a full refund.\n```\n")
    w("```text\nLes commandes quittent notre entrepôt sous 1 à 2 jours ouvrés. Délais entre la commande et la livraison : France métropolitaine 3 à 6 jours ouvrés ; Belgique, Luxembourg, Allemagne, Pays-Bas, Espagne, Italie et Irlande 4 à 7 jours ouvrés ; Royaume-Uni et Suisse 5 à 8 jours ouvrés (des taxes d'importation locales peuvent être demandées à la livraison) ; Corse 5 à 8 jours ouvrés. Nous ne livrons pas encore les départements et territoires d'outre-mer.\n\nLa livraison est offerte dès 50 euros, sinon elle coûte 5 euros. Toutes les commandes partent en livraison standard suivie ; vous recevez un e-mail et un SMS avec un lien de suivi au départ du colis. En cas d'absence, le transporteur dépose le colis dans un point relais proche, où il est gardé 10 jours.\n\nEn période chargée (de fin novembre à Noël, soldes), comptez 1 à 2 jours ouvrés de plus. Si votre colis a plus de 3 jours ouvrés de retard, contactez-nous via le formulaire de contact : nous ouvrons une enquête auprès du transporteur et envoyons un remplacement ou un remboursement complet.\n```\n")

    w("## Store settings the agent relies on\n")
    w("| Where | Setting |")
    w("| --- | --- |")
    w("| Settings → Taxes and duties | **Include sales tax in product price and shipping rate**: on (prices are VAT-inclusive, as the agent says them). France: collect VAT. |")
    w("| Settings → Markets | Primary market France, plus a Europe market (the 7 countries above) and UK/Switzerland. Currency EUR. |")
    w("| Settings → Languages | Add French and publish it. |")
    w("| Discounts → Create discount → Amount off order | Code **MERCI10**, 10% off the entire order, one use per customer. This is the offer the agent makes on the call. |")
    w("| Settings → Policies → Refund policy | Free returns within 30 days of delivery for unused items, prepaid label from the contact form, refund to the original payment method within 5 business days of receiving the parcel. |")
    w("| Settings → Checkout → Abandoned checkouts | Turn off Shopify's own abandoned-checkout email during the demo, so the call is the only follow-up. |")
    w("")
    return "\n".join(out)


CSV_COLS = ["Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags", "Published",
            "Option1 Name", "Option1 Value", "Variant SKU", "Variant Grams", "Variant Inventory Tracker",
            "Variant Inventory Qty", "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
            "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable", "Variant Barcode",
            "Image Src", "Image Position", "Image Alt Text", "Gift Card", "SEO Title", "SEO Description",
            "Variant Weight Unit", "Cost per item", "Status"]


def write_csv(path):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        wr = csv.writer(fh)
        wr.writerow(CSV_COLS)
        for p in P:
            row = {
                "Handle": p["handle"], "Title": p["title"][0], "Body (HTML)": body_html(p, 0).replace("\n", ""),
                "Vendor": VENDOR, "Product Category": "", "Type": p["type"][0], "Tags": p["tags"], "Published": "TRUE",
                "Option1 Name": "Title", "Option1 Value": "Default Title", "Variant SKU": p["sku"],
                "Variant Grams": p["grams"], "Variant Inventory Tracker": "shopify", "Variant Inventory Qty": p["qty"],
                "Variant Inventory Policy": "deny", "Variant Fulfillment Service": "manual",
                "Variant Price": f"{p['price']:.2f}", "Variant Compare At Price": "", "Variant Requires Shipping": "TRUE",
                "Variant Taxable": "TRUE", "Variant Barcode": "",
                "Image Src": IMG_BASE + f"maison-claire-{p['id']}.png", "Image Position": 1, "Image Alt Text": p["alt"][0],
                "Gift Card": "FALSE", "SEO Title": p["seo"][0][0], "SEO Description": p["seo"][0][1],
                "Variant Weight Unit": "kg", "Cost per item": euro(p["cost"]), "Status": "active",
            }
            wr.writerow([row[c] for c in CSV_COLS])


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "shopify"), exist_ok=True)
    with open(os.path.join(ROOT, "shopify", "products.md"), "w", encoding="utf-8") as fh:
        fh.write(markdown())
    write_csv(os.path.join(ROOT, "shopify", "products_import.csv"))
    print("Wrote shopify/products.md and shopify/products_import.csv")

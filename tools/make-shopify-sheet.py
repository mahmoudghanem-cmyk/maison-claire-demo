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
FURNITURE_DELIVERY = {
    "en": "Free two-person delivery to the room of your choice, on any floor. When your piece is ready, our delivery partner calls you to book a day and a 4-hour slot, Monday to Saturday. Free returns within 30 days of delivery: we collect it from your home.",
    "fr": "Livraison offerte par deux livreurs jusqu'à la pièce de votre choix, à n'importe quel étage. Quand votre meuble est prêt, notre transporteur vous appelle pour fixer un jour et un créneau de 4 heures, du lundi au samedi. Retours gratuits sous 30 jours après la livraison : nous venons le chercher chez vous.",
}

COLLECTIONS = {
    "kitchen": ("Kitchen & Table", "Cuisine et table"),
    "home": ("Home & Living", "Maison et déco"),
    "bath": ("Bath", "Salle de bain"),
    "furniture": ("Furniture", "Mobilier"),
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
        id="table", handle="solid-wood-dining-table", type=("Dining tables", "Tables à manger"),
        origin="France", hs="9403.60",
        category=("Kitchen & Dining Room Tables", "Furniture > Tables > Kitchen & Dining Room Tables"),
        collections=["furniture", "kitchen"],
        tags="furniture, dining table, solid wood, oak, walnut, made to order",
        title=("Solid Wood Dining Table", "Table à manger en bois massif"),
        options=(("Wood", "Bois", [("Natural oak", "Chêne naturel"), ("Smoked oak", "Chêne fumé"), ("Walnut", "Noyer")]),
                 ("Size", "Dimensions", [("180 × 90 cm", "180 × 90 cm"), ("220 × 100 cm", "220 × 100 cm")])),
        # (option values, SKU, price, cost, stock, shipping grams, image). Made to order: not tracked.
        variants=[
            (("Natural oak", "180 × 90 cm"), "MC-TBL-OAK-180", 1890, 760, None, 60000, "table-oak"),
            (("Natural oak", "220 × 100 cm"), "MC-TBL-OAK-220", 2290, 920, None, 78000, "table-oak"),
            (("Smoked oak", "180 × 90 cm"), "MC-TBL-SMK-180", 2040, 820, None, 60000, "table-smoked"),
            (("Smoked oak", "220 × 100 cm"), "MC-TBL-SMK-220", 2440, 980, None, 78000, "table-smoked"),
            (("Walnut", "180 × 90 cm"), "MC-TBL-WAL-180", 2390, 960, None, 54000, "table-walnut"),
            (("Walnut", "220 × 100 cm"), "MC-TBL-WAL-220", 2790, 1120, None, 70000, "table-walnut"),
        ],
        images=[("table-oak", "Natural oak dining table", "Table à manger en chêne naturel"),
                ("table-smoked", "Smoked oak dining table", "Table à manger en chêne fumé"),
                ("table-walnut", "Walnut dining table", "Table à manger en noyer")],
        stock_note="Made to order: don't track quantity",
        seo=(("Solid Oak or Walnut Dining Table, Made to Order | Maison Claire",
              "Solid oak or walnut dining table for 6 or 8 people, made to order in France. Free two-person delivery to the room of your choice."),
             ("Table à manger en chêne ou noyer massif | Maison Claire",
              "Table à manger en chêne ou noyer massif pour 6 ou 8 personnes, fabriquée en France. Livraison offerte par deux livreurs.")),
        alt=("Solid wood dining table with four tapered legs", "Table à manger en bois massif à quatre pieds fuselés"),
    ),
    dict(
        id="armchair", handle="lounge-armchair", type=("Armchairs", "Fauteuils"),
        origin="Portugal", hs="9401.61",
        category=("Arm Chairs, Recliners & Sleeper Chairs", "Furniture > Chairs > Arm Chairs, Recliners & Sleeper Chairs"),
        collections=["furniture", "home"],
        tags="furniture, armchair, velvet, boucle, living room",
        title=("Lounge Armchair", "Fauteuil de salon"),
        options=(("Fabric", "Tissu", [("Sage green velvet", "Velours vert sauge"), ("Terracotta velvet", "Velours terracotta"),
                                      ("Midnight blue velvet", "Velours bleu nuit"), ("Ivory wool bouclé", "Bouclette de laine ivoire")]),
                 ("Legs", "Pieds", [("Natural oak", "Chêne naturel"), ("Black-stained oak", "Chêne teinté noir")])),
        # Sage and ivory are in stock; terracotta and midnight blue are made to order (0 in stock, keep selling).
        variants=[
            (("Sage green velvet", "Natural oak"), "MC-ARM-SAG-OAK", 1290, 520, 6, 30000, "armchair-sage-oak"),
            (("Sage green velvet", "Black-stained oak"), "MC-ARM-SAG-BLK", 1290, 520, 3, 30000, "armchair-sage-black"),
            (("Terracotta velvet", "Natural oak"), "MC-ARM-TER-OAK", 1290, 520, 0, 30000, "armchair-terracotta-oak"),
            (("Terracotta velvet", "Black-stained oak"), "MC-ARM-TER-BLK", 1290, 520, 0, 30000, "armchair-terracotta-black"),
            (("Midnight blue velvet", "Natural oak"), "MC-ARM-MID-OAK", 1290, 520, 0, 30000, "armchair-midnight-oak"),
            (("Midnight blue velvet", "Black-stained oak"), "MC-ARM-MID-BLK", 1290, 520, 0, 30000, "armchair-midnight-black"),
            (("Ivory wool bouclé", "Natural oak"), "MC-ARM-IVO-OAK", 1390, 560, 4, 30000, "armchair-ivory-oak"),
            (("Ivory wool bouclé", "Black-stained oak"), "MC-ARM-IVO-BLK", 1390, 560, 2, 30000, "armchair-ivory-black"),
        ],
        images=[("armchair-sage-oak", "Sage green velvet armchair on natural oak legs", "Fauteuil en velours vert sauge, pieds en chêne naturel"),
                ("armchair-sage-black", "Sage green velvet armchair on black oak legs", "Fauteuil en velours vert sauge, pieds en chêne noir"),
                ("armchair-terracotta-oak", "Terracotta velvet armchair on natural oak legs", "Fauteuil en velours terracotta, pieds en chêne naturel"),
                ("armchair-terracotta-black", "Terracotta velvet armchair on black oak legs", "Fauteuil en velours terracotta, pieds en chêne noir"),
                ("armchair-midnight-oak", "Midnight blue velvet armchair on natural oak legs", "Fauteuil en velours bleu nuit, pieds en chêne naturel"),
                ("armchair-midnight-black", "Midnight blue velvet armchair on black oak legs", "Fauteuil en velours bleu nuit, pieds en chêne noir"),
                ("armchair-ivory-oak", "Ivory wool bouclé armchair on natural oak legs", "Fauteuil en bouclette de laine ivoire, pieds en chêne naturel"),
                ("armchair-ivory-black", "Ivory wool bouclé armchair on black oak legs", "Fauteuil en bouclette de laine ivoire, pieds en chêne noir")],
        stock_note="Track quantity. Terracotta and midnight blue: 0 in stock with *Continue selling when out of stock* on (made to order)",
        seo=(("Lounge Armchair in Velvet or Wool Bouclé | Maison Claire",
              "A deep lounge armchair in cotton velvet or wool bouclé, on solid oak legs. Arrives assembled, with free two-person delivery."),
             ("Fauteuil de salon en velours ou bouclette | Maison Claire",
              "Un fauteuil profond en velours de coton ou bouclette de laine, sur pieds en chêne massif. Livré monté, livraison offerte.")),
        alt=("Sage green velvet lounge armchair on oak legs", "Fauteuil de salon en velours vert sauge sur pieds en chêne"),
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
    "table": {
        "en": dict(paras=[
            "A made-to-order dining table in solid oak or walnut, for 6 or 8 people.",
            "Built to last for generations in our partner workshop in the Jura mountains in France. The top is made of solid wood boards 4 cm thick, joined edge to edge and finished by hand, with softly rounded edges and four tapered legs set 8 cm in from the corners, so a chair fits at each end.",
            "Choose natural oak for a light honey tone, smoked oak, darkened all the way through by a traditional fuming process rather than a stain, or American black walnut for a deep chocolate brown. Every table is unique: the grain, knots and colour vary from one board to the next.",
            "The matte hard-wax oil finish is food safe and easy to repair: light scratches and water rings can be sanded and re-oiled with the care kit included. Our two-person delivery team carries it to the room of your choice and bolts on the legs for you. Chairs are not included.",
        ], details=[
            ("Wood", "Solid European oak from French forests (natural or smoked), or solid American black walnut, FSC certified"),
            ("Sizes", "180 × 90 cm (seats 6) or 220 × 100 cm (seats 8)"),
            ("Height", "75 cm, with 66 cm of knee room under the frame. Suits chairs with a 44 to 48 cm seat"),
            ("Tabletop", "Solid boards, 4 cm thick, rounded edges"),
            ("Weight", "180 cm: 52 kg in oak, 46 kg in walnut. 220 cm: 68 kg in oak, 60 kg in walnut"),
            ("Maximum load", "120 kg, evenly spread"),
            ("Finish", "Matte hard-wax oil, food safe"),
            ("Assembly", "Legs bolt on. Free assembly by our delivery team, or 20 minutes for two people with the Allen key included"),
            ("Packaging", "Top in a flat box (190 × 100 × 12 cm or 230 × 110 × 12 cm), legs in a second box. Fits through an 80 cm door"),
            ("Care", "Damp cloth, coasters and trivets. Re-oil once a year with the care kit included. Keep 50 cm from radiators. Indoor use only"),
            ("Lead time", "Made to order: 6 to 8 weeks in oak, 8 to 10 weeks in walnut"),
            ("Made in", "France (Jura)"),
            ("Warranty", "10 years on the structure and joints"),
        ]),
        "fr": dict(paras=[
            "Une table à manger fabriquée à la commande en chêne ou noyer massif, pour 6 ou 8 personnes.",
            "Conçue pour traverser les générations dans notre atelier partenaire du Jura. Le plateau est composé de planches de bois massif de 4 cm d'épaisseur, assemblées à chant et finies à la main, avec des bords adoucis et quatre pieds fuselés placés à 8 cm des angles, pour qu'une chaise tienne à chaque bout.",
            "Choisissez le chêne naturel pour une teinte miel lumineuse, le chêne fumé, foncé dans toute son épaisseur par un fumage traditionnel et non par une teinture, ou le noyer noir d'Amérique pour un brun chocolat profond. Chaque table est unique : le fil du bois, les nœuds et la couleur varient d'une planche à l'autre.",
            "La finition à l'huile-cire mate est compatible avec le contact alimentaire et facile à rénover : rayures légères et auréoles se poncent et se huilent à nouveau avec le kit d'entretien fourni. Nos deux livreurs l'installent dans la pièce de votre choix et fixent les pieds pour vous. Chaises non incluses.",
        ], details=[
            ("Bois", "Chêne massif européen de forêts françaises (naturel ou fumé), ou noyer noir d'Amérique massif, certifié FSC"),
            ("Dimensions", "180 × 90 cm (6 personnes) ou 220 × 100 cm (8 personnes)"),
            ("Hauteur", "75 cm, dont 66 cm de passage pour les jambes. Pour des chaises de 44 à 48 cm d'assise"),
            ("Plateau", "Planches massives de 4 cm d'épaisseur, bords adoucis"),
            ("Poids", "180 cm : 52 kg en chêne, 46 kg en noyer. 220 cm : 68 kg en chêne, 60 kg en noyer"),
            ("Charge maximale", "120 kg répartis"),
            ("Finition", "Huile-cire mate, contact alimentaire"),
            ("Montage", "Pieds vissés. Montage offert par nos livreurs, ou 20 minutes à deux avec la clé Allen fournie"),
            ("Emballage", "Plateau dans un carton plat (190 × 100 × 12 cm ou 230 × 110 × 12 cm), pieds dans un second carton. Passe par une porte de 80 cm"),
            ("Entretien", "Chiffon humide, sous-verres et dessous-de-plat. Huiler une fois par an avec le kit fourni. À 50 cm des radiateurs. Usage intérieur"),
            ("Délai", "Fabriquée à la commande : 6 à 8 semaines en chêne, 8 à 10 semaines en noyer"),
            ("Fabriquée en", "France (Jura)"),
            ("Garantie", "10 ans sur la structure et les assemblages"),
        ]),
    },
    "armchair": {
        "en": dict(paras=[
            "A deep armchair in cotton velvet or wool bouclé, on solid oak legs.",
            "A generous armchair with a gently curved back and wide arms, made for long evenings with a book. The kiln-dried solid beech frame is built to last, the seat combines pocket springs with high-resilience foam so it keeps its shape, and the loose back cushion is filled with a soft mix of recycled duck feather and fibre.",
            "Choose a cotton velvet in sage green, terracotta or midnight blue, or an ivory wool bouclé with a soft looped texture. The legs are solid oak, natural or stained black. If you have a cat or a dog, we recommend velvet, as claws can catch in the bouclé loops.",
            "It arrives fully assembled: just screw on the four legs by hand, no tools needed. Without its legs it is 62 cm high, so it goes through a 65 cm doorway turned on its back. Sage green and ivory are in stock; terracotta and midnight blue are made to order.",
        ], details=[
            ("Fabric", "Cotton velvet (88% cotton, 12% polyester, 40,000 rubs) or wool bouclé (65% wool, 35% polyamide, 30,000 rubs)"),
            ("Legs", "Solid oak, natural or black-stained"),
            ("Dimensions", "78 cm wide, 84 cm deep, 76 cm high"),
            ("Seat", "42 cm high, 55 cm deep, medium firm. Arms 58 cm high"),
            ("Weight", "24 kg. Supports up to 130 kg"),
            ("Frame", "Kiln-dried solid beech"),
            ("Filling", "Pocket springs and high-resilience foam. Back cushion: 50% recycled duck feather, 50% polyester fibre (no feather-free version)"),
            ("Fire safety", "EN 1021 parts 1 and 2"),
            ("Assembly", "Arrives assembled. Screw on the 4 legs by hand. Box 84 × 90 × 82 cm"),
            ("Care", "Covers are not removable. Vacuum with a soft brush, dab spills with a damp cloth. Keep out of strong sunlight"),
            ("Lead time", "Sage green and ivory: in stock, 1 to 2 weeks. Terracotta and midnight blue: made to order, 4 to 5 weeks"),
            ("Made in", "Portugal"),
            ("Warranty", "10 years on the frame, 2 years on fabric, springs and cushions"),
        ]),
        "fr": dict(paras=[
            "Un fauteuil profond en velours de coton ou bouclette de laine, sur pieds en chêne massif.",
            "Un fauteuil généreux, au dossier légèrement arrondi et aux larges accoudoirs, pensé pour les longues soirées de lecture. La structure en hêtre massif séché au four est faite pour durer, l'assise associe ressorts ensachés et mousse haute résilience pour garder sa forme, et le coussin de dossier amovible est garni d'un doux mélange de plumes de canard recyclées et de fibres.",
            "Choisissez un velours de coton vert sauge, terracotta ou bleu nuit, ou une bouclette de laine ivoire à la texture moelleuse. Les pieds sont en chêne massif, naturel ou teinté noir. Si vous avez un chat ou un chien, nous conseillons le velours : les griffes peuvent accrocher les boucles de la bouclette.",
            "Il est livré entièrement monté : il suffit de visser les quatre pieds à la main, sans outil. Sans ses pieds, il mesure 62 cm de haut et passe, couché sur le dos, par une porte de 65 cm. Vert sauge et ivoire sont en stock ; terracotta et bleu nuit sont fabriqués à la commande.",
        ], details=[
            ("Tissu", "Velours de coton (88 % coton, 12 % polyester, 40 000 frottements) ou bouclette de laine (65 % laine, 35 % polyamide, 30 000 frottements)"),
            ("Pieds", "Chêne massif, naturel ou teinté noir"),
            ("Dimensions", "78 cm de large, 84 cm de profondeur, 76 cm de haut"),
            ("Assise", "42 cm de haut, 55 cm de profondeur, confort mi-ferme. Accoudoirs à 58 cm"),
            ("Poids", "24 kg. Supporte jusqu'à 130 kg"),
            ("Structure", "Hêtre massif séché au four"),
            ("Garnissage", "Ressorts ensachés et mousse haute résilience. Coussin de dossier : 50 % plumes de canard recyclées, 50 % fibres de polyester (pas de version sans plumes)"),
            ("Sécurité incendie", "EN 1021 parties 1 et 2"),
            ("Montage", "Livré monté. Vissez les 4 pieds à la main. Carton de 84 × 90 × 82 cm"),
            ("Entretien", "Housses non déhoussables. Aspirer avec une brosse souple, tamponner les taches avec un chiffon humide. Éviter le plein soleil"),
            ("Délai", "Vert sauge et ivoire : en stock, 1 à 2 semaines. Terracotta et bleu nuit : fabriqué à la commande, 4 à 5 semaines"),
            ("Fabriqué au", "Portugal"),
            ("Garantie", "10 ans sur la structure, 2 ans sur le tissu, les ressorts et les coussins"),
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
    lines += ["", LABEL[lang][1], delivery(p, lang)]
    return "\n".join(lines)


def body_html(p, i):
    """Same content as body_text, as HTML for the CSV import (Shopify needs HTML there)."""
    lang = "en" if i == 0 else "fr"
    e = html.escape
    sep = ":" if lang == "en" else " :"
    paras = "".join(f"<p>{e(x)}</p>" for x in p["paras"][i])
    rows = "".join(f"<li><strong>{e(k)}{sep}</strong> {e(v)}</li>" for k, v in p["details"][i])
    return (f"{paras}<h4>{LABEL[lang][0]}</h4><ul>{rows}</ul>"
            f"<h4>{LABEL[lang][1]}</h4><p>{e(delivery(p, lang))}</p>")


def delivery(p, lang):
    return FURNITURE_DELIVERY[lang] if p.get("variants") else DELIVERY[lang]


def euro(x):
    return f"{x:.2f}"


def rng(vals, fmt=lambda x: f"{x:g}"):
    lo, hi = min(vals), max(vals)
    return fmt(lo) if lo == hi else f"{fmt(lo)} to {fmt(hi)}"


def image(p):
    """Main image file name (without extension)."""
    return p["images"][0][0] if p.get("images") else p["id"]


def markdown():
    out = []
    w = out.append
    w("# Maison Claire: products for Shopify\n")
    w("Generated by `tools/make-shopify-sheet.py` from the same data as the demo store (`assets/catalog.js`) "
      "and the agent's knowledge base (`docs/kb-delivery.md`), so prices, sizes and delivery promises match what "
      "the voice agent says. Edit the script and re-run it rather than editing this file.\n")
    w("**Two ways to load the products**\n")
    w("- **Fastest:** Shopify Admin → **Products** → **Import** → upload [`products_import.csv`](products_import.csv). "
      "It creates all 8 products in English with price, cost, SKU, stock, weight, tags, SEO and images, including the 6 table and 8 armchair variants. "
      "Then add the few fields the CSV can't carry (category, collections, customs, French): see *After the import* below.\n")
    w("- **By hand:** Products → **Add product**, and copy each field from the product cards below. "
      "Descriptions are plain text: paste them straight into the description box (each line becomes its own paragraph).\n")
    w("Prices include VAT (see *Store settings*). Inventory quantities, cost prices, countries of origin and HS codes "
      "are realistic but invented for this demo store.\n")

    w("## Summary\n")
    w("| Product | Handle | SKU | Price | Cost | Stock | Shipping weight |")
    w("| --- | --- | --- | ---: | ---: | ---: | ---: |")
    for p in P:
        if p.get("variants"):
            v = p["variants"]
            stock = "made to order" if all(x[4] is None for x in v) else f"{sum(x[4] or 0 for x in v)} + made to order"
            w(f"| {p['title'][0]} | `{p['handle']}` | {len(v)} variants | {rng([x[2] for x in v])} € | "
              f"{rng([x[3] for x in v])} € | {stock} | {rng([x[5] / 1000 for x in v])} kg |")
        else:
            w(f"| {p['title'][0]} | `{p['handle']}` | `{p['sku']}` | {p['price']} € | {euro(p['cost'])} € | {p['qty']} | {p['grams'] / 1000:g} kg |")
    w("")

    for n, p in enumerate(P, 1):
        w(f"## {n}. {p['title'][0]} / {p['title'][1]}\n")
        w(f"![{p['alt'][0]}](images/maison-claire-{image(p)}.png)\n")
        w("**Main fields** (Add product page, top to bottom)\n")
        w("| Field | Value |")
        w("| --- | --- |")
        var = p.get("variants")
        if var:
            media = (f"{len(p['images'])} images, `shopify/images/maison-claire-{p['id']}-*.png` "
                     f"(one per variant colour, see the variants table)")
            single = [
                ("Price", "set per variant (table below)"),
                ("Compare-at price", "leave empty (the agent's offer is the MERCI10 code)"),
                ("Charge tax on this product", "Yes"),
                ("Cost per item", "set per variant"),
                ("Inventory", p["stock_note"]),
                ("SKU", "set per variant"),
                ("This is a physical product", "Yes"),
                ("Weight (with packaging)", "set per variant"),
                ("Shipping profile", "Furniture (see Shipping below)"),
            ]
        else:
            media = f"`shopify/images/maison-claire-{p['id']}.png`, alt text: {p['alt'][0]}"
            single = [
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
            ]
        rows = [
            ("Title", p["title"][0]),
            ("Description", "plain text block below"),
            ("Media", media),
            ("Category", f"search **{p['category'][0]}** ({p['category'][1]})"),
        ] + single + [
            ("Country/Region of origin", p["origin"]),
            ("HS code", p["hs"]),
            ("Variants", "two options, see the variants table below" if var else "none (one version only)"),
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
            w(f"| {k} | {str(v).replace('|', chr(92) + '|')} |")
        w("")
        if var:
            (o1, o1fr, vals1), (o2, o2fr, vals2) = p["options"]
            w(f"**Variants** (Variants → Add options: *{o1}* with {', '.join(x[0] for x in vals1)}; "
              f"*{o2}* with {', '.join(x[0] for x in vals2)}. Then fill each row)\n")
            w(f"| {o1} | {o2} | SKU | Price | Cost | Inventory | Weight | Image |")
            w("| --- | --- | --- | ---: | ---: | --- | ---: | --- |")
            for vals, sku, price, cost, qty, grams, img in var:
                inv = "not tracked" if qty is None else (f"{qty}" if qty else "0, keep selling")
                w(f"| {vals[0]} | {vals[1]} | `{sku}` | {price} € | {cost} € | {inv} | {grams / 1000:g} kg | `{img}` |")
            w("")
            w("Image alt texts: " + "; ".join(f"`{i}`: {en}" for i, en, fr in p["images"]) + "\n")
        w("**Description (English)**\n")
        w("```text\n" + body_text(p, 0) + "\n```\n")
        w("**French translation** (Settings → Languages → French → Translate, or the Translate & Adapt app)\n")
        w("| Field | Valeur |")
        w("| --- | --- |")
        w(f"| Title | {p['title'][1]} |")
        w(f"| Page title (SEO) | {p['seo'][1][0].replace('|', chr(92) + '|')} |")
        w(f"| Meta description (SEO) | {p['seo'][1][1]} |")
        w(f"| Image alt text | {p['alt'][1]} |")
        w(f"| Type | {p['type'][1]} |")
        if var:
            for (n_en, n_fr, vals) in p["options"]:
                w(f"| Option {n_en} | {n_fr}: " + ", ".join(f"{a} → {b}" for a, b in vals if a != b) + " |")
        w("")
        w("**Description (français)**\n")
        w("```text\n" + body_text(p, 1) + "\n```\n")

    w("## After the import\n")
    w("The Shopify CSV has no columns for these, so set them once per product (or in bulk: select the products → **Bulk edit**):\n")
    w("1. **Category**: open each product, type the search word from its card into *Category*.")
    w("2. **Customs**: *Country/Region of origin* and *HS code*, in the Shipping section of each product (needed for the UK and Switzerland).")
    w("3. **Furniture shipping profile**: move the dining table and the armchair into the *Furniture* profile (see Shipping below).")
    w("4. **Collections**: create these five manual collections (Products → Collections → Create collection), then add the products:\n")
    w("| Collection (EN) | Collection (FR) | Products |")
    w("| --- | --- | --- |")
    for key, (en, fr) in COLLECTIONS.items():
        members = ", ".join(p["title"][0] for p in P if key in p["collections"])
        w(f"| {en} | {fr} | {members} |")
    w("")
    w("5. **French**: paste the French title, description, SEO fields and option names from each card.\n")

    w("## Shipping (Settings → Shipping and delivery)\n")
    w("These rates match the agent's knowledge base: parcels leave in 1 to 2 business days, 5 € delivery, free from 50 €, "
      "tracked standard delivery only. Furniture has its own free profile (below).\n")
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
    w("**Furniture profile.** The dining table and the armchair must not get the 5 € parcel rate. In Shipping and delivery → "
      "**Custom shipping rates** → *Create a custom shipping profile* named **Furniture**, add the two furniture products, "
      "add the same three zones, and give each zone one rate: *Free two-person delivery*, 0.00 €, with the description "
      "*Delivered to the room of your choice. We call you to book a day once it is ready.* "
      "(FR: *Livraison offerte par deux livreurs* / *Livrée dans la pièce de votre choix. Nous vous appelons pour fixer un jour quand elle est prête.*)\n")
    w("**Packages** (Shipping and delivery → Packages): set a default box of 30 × 25 × 15 cm, and add a large box of "
      "45 × 35 × 35 cm for the lamp. Furniture packaging is on each furniture card (table top 190 × 100 × 12 or "
      "230 × 110 × 12 cm plus a legs box, armchair 84 × 90 × 82 cm). Product weights above already include packaging.\n")
    w("**Shipping policy** (Settings → Policies → Shipping policy):\n")
    w("```text\nOrders leave our warehouse within 1 to 2 business days. Delivery times from order to door: mainland France 3 to 6 business days; Belgium, Luxembourg, Germany, the Netherlands, Spain, Italy and Ireland 4 to 7 business days; United Kingdom and Switzerland 5 to 8 business days (local import taxes may be charged on delivery); Corsica 5 to 8 business days. We do not deliver to the French overseas territories yet.\n\nDelivery is free from 50 euros, otherwise 5 euros. All orders go by tracked standard delivery; you receive an email and a text message with a tracking link when your parcel leaves. If you are not home, the carrier leaves your parcel at a nearby pickup point for 10 days.\n\nDuring busy periods (late November to Christmas, sales) please allow 1 to 2 extra business days. If your parcel is more than 3 business days late, contact us through the contact form: we will investigate with the carrier and send a replacement or a full refund.\n\nFurniture (dining table and armchair): free two-person delivery to the room of your choice, on any floor, with unpacking, table assembly and packaging removal. Each piece is made or prepared first: armchair 1 to 2 weeks in sage green or ivory, 4 to 5 weeks in terracotta or midnight blue; table 6 to 8 weeks in oak, 8 to 10 weeks in walnut. When it is ready, our delivery partner calls or texts you to book a day and a 4-hour slot, Monday to Saturday, usually within 1 to 2 weeks. Someone aged 18 or over must be home. If a slot is missed without notice, the first new booking is free, then each new attempt costs 59 euros. In an order with furniture and smaller items, the smaller items ship separately within 1 to 2 business days.\n```\n")
    w("```text\nLes commandes quittent notre entrepôt sous 1 à 2 jours ouvrés. Délais entre la commande et la livraison : France métropolitaine 3 à 6 jours ouvrés ; Belgique, Luxembourg, Allemagne, Pays-Bas, Espagne, Italie et Irlande 4 à 7 jours ouvrés ; Royaume-Uni et Suisse 5 à 8 jours ouvrés (des taxes d'importation locales peuvent être demandées à la livraison) ; Corse 5 à 8 jours ouvrés. Nous ne livrons pas encore les départements et territoires d'outre-mer.\n\nLa livraison est offerte dès 50 euros, sinon elle coûte 5 euros. Toutes les commandes partent en livraison standard suivie ; vous recevez un e-mail et un SMS avec un lien de suivi au départ du colis. En cas d'absence, le transporteur dépose le colis dans un point relais proche, où il est gardé 10 jours.\n\nEn période chargée (de fin novembre à Noël, soldes), comptez 1 à 2 jours ouvrés de plus. Si votre colis a plus de 3 jours ouvrés de retard, contactez-nous via le formulaire de contact : nous ouvrons une enquête auprès du transporteur et envoyons un remplacement ou un remboursement complet.\n\nMobilier (table à manger et fauteuil) : livraison offerte par deux livreurs jusqu'à la pièce de votre choix, à n'importe quel étage, avec déballage, montage de la table et reprise des emballages. Chaque meuble est d'abord fabriqué ou préparé : fauteuil 1 à 2 semaines en vert sauge ou ivoire, 4 à 5 semaines en terracotta ou bleu nuit ; table 6 à 8 semaines en chêne, 8 à 10 semaines en noyer. Quand il est prêt, notre transporteur vous appelle ou vous envoie un SMS pour fixer un jour et un créneau de 4 heures, du lundi au samedi, généralement sous 1 à 2 semaines. Une personne majeure doit être présente. Si un créneau est manqué sans prévenir, le premier nouveau rendez-vous est gratuit, puis chaque nouvelle tentative coûte 59 euros. Dans une commande avec du mobilier et des petits articles, les petits articles partent séparément sous 1 à 2 jours ouvrés.\n```\n")

    w("## Store settings the agent relies on\n")
    w("| Where | Setting |")
    w("| --- | --- |")
    w("| Settings → Taxes and duties | **Include sales tax in product price and shipping rate**: on (prices are VAT-inclusive, as the agent says them). France: collect VAT. |")
    w("| Settings → Markets | Primary market France, plus a Europe market (the 7 countries above) and UK/Switzerland. Currency EUR. |")
    w("| Settings → Languages | Add French and publish it. |")
    w("| Discounts → Create discount → Amount off order | Code **MERCI10**, 10% off the entire order, one use per customer. This is the offer the agent makes on the call. |")
    w("| Settings → Policies → Refund policy | Free returns within 30 days of delivery for unused items, prepaid label from the contact form, refund to the original payment method within 5 business days of receiving the parcel. Furniture: free collection from the customer's room within 30 days of delivery (unused, undamaged, original boxes not needed); orders can be changed or cancelled within 7 days of ordering. |")
    w("| Settings → Checkout → Abandoned checkouts | Turn off Shopify's own abandoned-checkout email during the demo, so the call is the only follow-up. |")
    w("")
    return "\n".join(out)


CSV_COLS = ["Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags", "Published",
            "Option1 Name", "Option1 Value", "Option2 Name", "Option2 Value", "Variant SKU", "Variant Grams", "Variant Inventory Tracker",
            "Variant Inventory Qty", "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
            "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable", "Variant Barcode",
            "Image Src", "Image Position", "Image Alt Text", "Gift Card", "SEO Title", "SEO Description",
            "Variant Image", "Variant Weight Unit", "Cost per item", "Status"]


def write_csv(path):
    """Classic Shopify product CSV. A product with options gets one row per variant; product fields
    (title, body, tags, SEO, option names) go on its first row only, and each image on its own row."""
    with open(path, "w", newline="", encoding="utf-8") as fh:
        wr = csv.writer(fh)
        wr.writerow(CSV_COLS)
        for p in P:
            head = {
                "Handle": p["handle"], "Title": p["title"][0], "Body (HTML)": body_html(p, 0).replace("\n", ""),
                "Vendor": VENDOR, "Product Category": "", "Type": p["type"][0], "Tags": p["tags"], "Published": "TRUE",
                "Gift Card": "FALSE", "SEO Title": p["seo"][0][0], "SEO Description": p["seo"][0][1], "Status": "active",
            }
            if p.get("variants"):
                (o1, _, _), (o2, _, _) = p["options"]
                rows = []
                for n, (vals, sku, price, cost, qty, grams, img) in enumerate(p["variants"]):
                    row = dict(head) if n == 0 else {"Handle": p["handle"]}
                    row.update({
                        "Option1 Name": o1 if n == 0 else "", "Option1 Value": vals[0],
                        "Option2 Name": o2 if n == 0 else "", "Option2 Value": vals[1],
                        "Variant SKU": sku, "Variant Grams": grams,
                        "Variant Inventory Tracker": "" if qty is None else "shopify",
                        "Variant Inventory Qty": "" if qty is None else qty,
                        "Variant Inventory Policy": "continue" if not qty else "deny",
                        "Variant Fulfillment Service": "manual", "Variant Price": f"{price:.2f}",
                        "Variant Requires Shipping": "TRUE", "Variant Taxable": "TRUE",
                        "Variant Image": IMG_BASE + f"maison-claire-{img}.png",
                        "Variant Weight Unit": "kg", "Cost per item": euro(cost),
                    })
                    rows.append(row)
                for n, (img, alt_en, _) in enumerate(p["images"]):
                    if n >= len(rows):
                        rows.append({"Handle": p["handle"]})
                    rows[n].update({"Image Src": IMG_BASE + f"maison-claire-{img}.png", "Image Position": n + 1,
                                    "Image Alt Text": alt_en})
            else:
                row = dict(head)
                row.update({
                    "Option1 Name": "Title", "Option1 Value": "Default Title", "Variant SKU": p["sku"],
                    "Variant Grams": p["grams"], "Variant Inventory Tracker": "shopify", "Variant Inventory Qty": p["qty"],
                    "Variant Inventory Policy": "deny", "Variant Fulfillment Service": "manual",
                    "Variant Price": f"{p['price']:.2f}", "Variant Requires Shipping": "TRUE", "Variant Taxable": "TRUE",
                    "Image Src": IMG_BASE + f"maison-claire-{p['id']}.png", "Image Position": 1,
                    "Image Alt Text": p["alt"][0], "Variant Weight Unit": "kg", "Cost per item": euro(p["cost"]),
                })
                rows = [row]
            for row in rows:
                wr.writerow([row.get(c, "") for c in CSV_COLS])


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "shopify"), exist_ok=True)
    with open(os.path.join(ROOT, "shopify", "products.md"), "w", encoding="utf-8") as fh:
        fh.write(markdown())
    write_csv(os.path.join(ROOT, "shopify", "products_import.csv"))
    print("Wrote shopify/products.md and shopify/products_import.csv")

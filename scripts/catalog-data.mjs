/**
 * Starter catalog used by scripts/seed-catalog.mjs: a Shajgoj-style category tree, Korean beauty
 * brands and demo products. Everything here only fills gaps — once a record exists, the admin
 * dashboard owns it and the seeder never overwrites it.
 */

const img = (id) => `https://images.unsplash.com/photo-${id}?w=800`;

// Unbranded product photography, grouped by what it shows
export const IMAGES = {
  cleanser: img("1556228852-6d35a585d566"),
  cleansingOil: img("1570172619644-dfd03ed5d881"),
  toner: img("1556228720-195a672e8a03"),
  tonerAlt: img("1556228578-0d85b1a4d571"),
  serum: img("1620916566398-39f1143ab7be"),
  serumAlt: img("1620916297397-a4a5402a3c6c"),
  dropper: img("1608571423902-eed4a5ad8108"),
  cream: img("1535585209827-a15fcdbc4c2d"),
  creamAlt: img("1522337360788-8b13dee7a37e"),
  sunscreen: img("1598440947619-2c35fc9aa908"),
  sheetMask: img("1596755094514-f87e34085b2c"),
  facial: img("1616394584738-fc6e612e71b9"),
  clayMask: img("1515377905703-c4788e51af15"),
  lip: img("1586495777744-4413f21062fa"),
  lipsticks: img("1571875257727-256c39da42af"),
  makeupFlatlay: img("1596462502278-27bfdc403348"),
  palette: img("1583241800698-e8ab01830a07"),
  paletteAlt: img("1596704017254-9b121068fb31"),
  powder: img("1515688594390-b649af70d282"),
  hairBottles: img("1631729371254-42c2892f0e6e"),
  hairNatural: img("1612817288484-6f916006741a"),
  bath: img("1526758097130-bab247274f58"),
  jar: img("1599305090598-fe179d501227"),
  bottles: img("1585652757141-8837d676fac8"),
  mens: img("1627384113743-6bd5a479fffd"),
  tools: img("1600428853876-fb5a850b444f"),
  set: img("1571781926291-c477ebfd024b"),
  setAlt: img("1601049541289-9b1b7bbbfe19"),
};

/**
 * Two-level tree. `legacy` lists the slug (and original name) of an older flat category that
 * becomes this subcategory — its URL and products are kept, it just moves under the new parent.
 */
export const CATEGORIES = [
  {
    name: "Skin Care",
    slug: "skin-care",
    image: IMAGES.serum,
    description:
      "Cleansers, toners, serums, moisturisers and sunscreens — the complete Korean skincare routine.",
    children: [
      { name: "Cleanser & Face Wash", slug: "cleansers", legacyName: "Cleansers & Washes" },
      { name: "Cleansing Oil & Balm", slug: "cleansing-oil-balm" },
      { name: "Toner & Essence", slug: "toners", legacyName: "Toners & Essences" },
      { name: "Serum & Ampoule", slug: "serums", legacyName: "Serums & Ampoules" },
      { name: "Moisturizer & Cream", slug: "moisturizers", legacyName: "Moisturizers & Creams" },
      { name: "Sunscreen", slug: "sunscreens", legacyName: "Sun Care & SPF" },
      { name: "Face Mask & Pack", slug: "masks", legacyName: "Sheet Masks & Peels" },
      { name: "Exfoliator & Peeling", slug: "exfoliators" },
      { name: "Acne & Spot Care", slug: "acne-care" },
      { name: "Eye & Lip Care", slug: "eye-lip-care", legacyName: "Eye & Lip Treatments" },
    ],
  },
  {
    name: "Makeup",
    slug: "makeup",
    image: IMAGES.makeupFlatlay,
    description: "Cushions, lip tints, mascaras and everyday K-beauty makeup.",
    children: [
      { name: "Cushion & Foundation", slug: "cushion-foundation" },
      { name: "BB & CC Cream", slug: "bb-cc-cream" },
      { name: "Concealer & Primer", slug: "concealer-primer" },
      { name: "Lip Tint & Lipstick", slug: "lip-tint-lipstick" },
      { name: "Eye Makeup", slug: "eye-makeup" },
      { name: "Blush & Highlighter", slug: "blush-highlighter" },
      { name: "Makeup Remover", slug: "makeup-remover" },
    ],
  },
  {
    name: "Hair Care",
    slug: "hair-care",
    image: IMAGES.hairBottles,
    description: "Korean shampoos, hair serums and treatments for damaged, frizzy or falling hair.",
    children: [
      { name: "Shampoo", slug: "shampoo" },
      { name: "Conditioner", slug: "conditioner" },
      { name: "Hair Oil & Serum", slug: "hair-oil-serum" },
      { name: "Hair Mask & Treatment", slug: "hair-treatment" },
      { name: "Scalp Care", slug: "scalp-care" },
    ],
  },
  {
    name: "Bath & Body",
    slug: "bath-body",
    image: IMAGES.bath,
    description: "Gentle body washes, rich lotions, scrubs and hand creams.",
    children: [
      { name: "Body Wash", slug: "body-wash" },
      { name: "Body Lotion & Cream", slug: "body-lotion" },
      { name: "Body Scrub", slug: "body-scrub" },
      { name: "Hand & Foot Care", slug: "hand-foot-care" },
    ],
  },
  {
    name: "Men's Care",
    slug: "mens-care",
    image: IMAGES.mens,
    description: "Simple, effective skincare made for men's skin.",
    children: [
      { name: "Men's Face Wash", slug: "mens-face-wash" },
      { name: "Men's Moisturizer", slug: "mens-moisturizer" },
      { name: "Men's Grooming Sets", slug: "mens-sets" },
    ],
  },
  {
    name: "Sets & Gifts",
    slug: "sets-gifts",
    image: IMAGES.set,
    description: "Routine sets, travel minis and gift boxes — better value, beautifully packed.",
    children: [
      { name: "Routine Sets", slug: "sets", legacyName: "K-Beauty Routine Sets" },
      { name: "Travel & Mini Kits", slug: "travel-kits" },
      { name: "Gift Boxes", slug: "gift-boxes" },
    ],
  },
  {
    name: "Beauty Tools",
    slug: "beauty-tools",
    image: IMAGES.tools,
    description: "Gua sha, rollers, puffs and brushes for a flawless routine.",
    children: [
      { name: "Face Roller & Gua Sha", slug: "face-roller-gua-sha" },
      { name: "Puffs, Sponges & Brushes", slug: "makeup-tools" },
      { name: "Cotton & Pads", slug: "cotton-pads" },
    ],
  },
];

/** Old fashion categories from the original template — hidden, and their products archived. */
export const RETIRED_CATEGORY_SLUGS = ["rings", "earrings", "bags", "watches"];

/**
 * Brands. `prefix` links existing products whose slug starts with it; `featured` brands are
 * shown on the homepage and highlighted in the navigation menu.
 */
export const BRANDS = [
  {
    name: "COSRX",
    prefix: "cosrx-",
    featured: true,
    description:
      "Minimal, effective formulas built around hero ingredients like snail mucin and BHA.",
  },
  {
    name: "Beauty of Joseon",
    prefix: "beauty-of-joseon-",
    featured: true,
    description: "Hanbang (traditional Korean herbal) skincare with modern textures.",
  },
  {
    name: "Anua",
    prefix: "anua-",
    featured: true,
    description: "Soothing heartleaf skincare for sensitive and acne-prone skin.",
  },
  {
    name: "SKIN1004",
    prefix: "skin1004-",
    featured: true,
    description: "Madagascar centella formulas that calm and hydrate stressed skin.",
  },
  {
    name: "Round Lab",
    prefix: "round-lab-",
    featured: true,
    description: "Clean, gentle skincare powered by Dokdo deep-sea water and birch juice.",
  },
  {
    name: "Torriden",
    prefix: "torriden-",
    featured: true,
    description: "Low-molecular hyaluronic acid hydration for every skin type.",
  },
  {
    name: "Laneige",
    prefix: "laneige-",
    featured: true,
    description: "Water science skincare — famous for the Lip Sleeping Mask.",
  },
  {
    name: "Some By Mi",
    prefix: "some-by-mi-",
    featured: true,
    description: "Targeted AHA, BHA and cica care for clear, calm skin.",
  },
  {
    name: "rom&nd",
    slug: "romand",
    featured: true,
    description: "Trend-setting Korean lip tints, palettes and mascaras.",
  },
  {
    name: "CLIO",
    featured: true,
    description: "Professional-grade Korean makeup with long-lasting cover.",
  },
  {
    name: "Mise en Scène",
    slug: "mise-en-scene",
    featured: true,
    description: "Salon-quality hair serums and damage care from Korea.",
  },
  {
    name: "Innisfree",
    featured: true,
    description: "Jeju-inspired natural skincare, from green tea serums to volcanic clay.",
  },
  {
    name: "Haruharu Wonder",
    prefix: "haruharu-wonder-",
    description: "Fermented black rice skincare for sensitive skin.",
  },
  {
    name: "I'm From",
    slug: "im-from",
    prefix: "im-from-",
    description: "Single-ingredient heroes like rice, mugwort and ginseng.",
  },
  {
    name: "TOCOBO",
    prefix: "tocobo-",
    description: "Vegan, lightweight sun care and fruity daily essentials.",
  },
  {
    name: "Klairs",
    prefix: "klairs-",
    description: "Simple, fragrance-free care for sensitive skin.",
  },
  {
    name: "AXIS-Y",
    prefix: "axis-y-",
    description: "Brightening and pore care inspired by Asian botanicals.",
  },
  {
    name: "Mediheal",
    prefix: "mediheal-",
    description: "Korea's best-selling sheet masks and pads.",
  },
  { name: "Etude", prefix: "etude-", description: "Playful Korean makeup and gentle skincare." },
  {
    name: "Banila Co",
    prefix: "banila-co-",
    description: "Home of Clean It Zero, the cult cleansing balm.",
  },
  {
    name: "Illiyoon",
    prefix: "illiyoon-",
    description: "Ceramide care for very dry and sensitive skin, head to toe.",
  },
  { name: "Peripera", description: "Velvet lip tints and cute, colourful makeup." },
  { name: "TIRTIR", description: "Viral Mask Fit cushions with long-wear coverage." },
  { name: "Missha", description: "Accessible Korean classics, from BB cream to first essence." },
  {
    name: "Isntree",
    description: "Honest skincare for sensitive skin — hyaluronic acid and green tea.",
  },
  { name: "Numbuzin", description: "Numbered serums, each built to solve one skin concern." },
  { name: "Ryo", description: "Hanbang hair care for hair loss and scalp health." },
  { name: "Masil", description: "Salon-style hair masks and probiotic shampoos." },
  {
    name: "Daeng Gi Meo Ri",
    slug: "daeng-gi-meo-ri",
    description: "Traditional herbal shampoos for strong, healthy hair.",
  },
  { name: "Happy Bath", description: "Fragrant, moisturising body care for everyday bathing." },
  {
    name: "Fillimilli",
    description: "Korean beauty tools — cushion puffs, brushes and cotton pads.",
  },
];

/**
 * Existing products that fit a new, more specific subcategory. Applied only the first time a
 * product is migrated from the old flat categories (i.e. while it has no subcategory yet).
 */
export const SUBCATEGORY_OVERRIDES = {
  "skin1004-madagascar-centella-light-cleansing-oil": "cleansing-oil-balm",
  "anua-heartleaf-pore-control-cleansing-oil": "cleansing-oil-balm",
  "banila-co-clean-it-zero-original-cleansing-balm": "cleansing-oil-balm",
  "skin1004-madagascar-centella-soothing-travel-kit": "travel-kits",
};

// ─── Demo products ───
// p(name, brand, subcategory, price, extra) — `was` is the regular price when on sale

const p = (name, brand, sub, price, extra = {}) => ({ name, brand, sub, price, ...extra });

export const PRODUCTS = [
  // Skin care
  p("Isntree Hyaluronic Acid Watery Sun Gel SPF50+", "Isntree", "sunscreens", 1650, {
    img: "sunscreen",
    was: 1850,
    bestseller: true,
    desc: "A weightless, water-light gel sunscreen with 8 types of hyaluronic acid. No white cast, no stickiness.",
  }),
  p("Isntree Green Tea Fresh Toner", "Isntree", "toners", 1450, {
    img: "toner",
    desc: "A refreshing toner with 80% Jeju green tea that controls oil and calms heat-stressed skin.",
  }),
  p("Isntree Clear Skin 8% AHA Essence", "Isntree", "exfoliators", 1750, {
    img: "serumAlt",
    desc: "A gentle 8% glycolic acid essence that smooths rough texture and brightens dull skin.",
  }),
  p("Numbuzin No.3 Skin Softening Serum", "Numbuzin", "serums", 2150, {
    img: "dropper",
    trending: true,
    desc: "A fermented-ingredient serum that softens texture and gives a glassy glow.",
  }),
  p("Numbuzin No.5 Vitamin Concentrated Serum", "Numbuzin", "serums", 2250, {
    img: "serum",
    was: 2550,
    desc: "Vitamin C and glutathione serum that fades dark spots and evens out skin tone.",
  }),
  p("Numbuzin No.1 Clear Filter Cleansing Oil", "Numbuzin", "cleansing-oil-balm", 1950, {
    img: "cleansingOil",
    desc: "A light cleansing oil that melts sunscreen, makeup and blackheads, then rinses clean.",
  }),
  p("COSRX Acne Pimple Master Patch (24 pcs)", "COSRX", "acne-care", 450, {
    img: "facial",
    bestseller: true,
    desc: "Hydrocolloid patches that absorb gunk and protect breakouts while they heal.",
  }),
  p("COSRX BHA Blackhead Power Liquid", "COSRX", "exfoliators", 1850, {
    img: "serumAlt",
    desc: "A 4% betaine salicylate exfoliant that clears blackheads and refines pores.",
  }),
  p("COSRX Oil-Free Ultra-Moisturizing Lotion", "COSRX", "mens-moisturizer", 1550, {
    img: "mens",
    desc: "A light birch-sap lotion that hydrates without shine — ideal for oily skin.",
  }),
  p("Some By Mi AHA BHA PHA 30 Days Miracle Toner", "Some By Mi", "toners", 1350, {
    img: "tonerAlt",
    was: 1550,
    desc: "A daily exfoliating toner with tea tree to clear breakouts and smooth skin.",
  }),
  p("Mediheal Madecassoside Blemish Pad (100 pcs)", "Mediheal", "acne-care", 1650, {
    img: "facial",
    desc: "Soothing toner pads with madecassoside that calm redness and blemishes.",
  }),
  p("Mediheal Tea Tree Essential Mask (10 pcs)", "Mediheal", "masks", 1100, {
    img: "sheetMask",
    desc: "Tea tree sheet masks that cool, calm and clarify troubled skin.",
  }),
  p("AXIS-Y Mugwort Pore Clarifying Wash Off Pack", "AXIS-Y", "masks", 1650, {
    img: "clayMask",
    desc: "A creamy mugwort and clay mask that deep-cleans pores without drying.",
  }),
  p("AXIS-Y Artichoke Intensive Skin Barrier Ampoule", "AXIS-Y", "serums", 1750, {
    img: "dropper",
    new: true,
    desc: "An artichoke ampoule that strengthens the skin barrier and reduces redness.",
  }),
  p("Klairs Freshly Juiced Vitamin Drop", "Klairs", "serums", 1950, {
    img: "serum",
    desc: "A gentle 5% vitamin C serum for sensitive skin that brightens and evens tone.",
  }),
  p("Klairs Midnight Blue Calming Cream", "Klairs", "moisturizers", 1850, {
    img: "creamAlt",
    desc: "A blue guaiazulene cream that cools and soothes irritated, sensitive skin.",
  }),
  p("I'm From Vitamin Tree Water-Gel", "I'm From", "moisturizers", 1950, {
    img: "cream",
    new: true,
    desc: "A bouncy water-gel packed with sea buckthorn vitamins for a healthy glow.",
  }),
  p("TOCOBO Vita Berry Pore Toner", "TOCOBO", "toners", 1550, {
    img: "toner",
    desc: "A berry-vitamin toner that tightens the look of pores and refreshes skin.",
  }),
  p("TOCOBO Coconut Clay Cleansing Foam", "TOCOBO", "cleansers", 1250, {
    img: "cleanser",
    desc: "A creamy clay foam that removes oil and impurities while keeping skin soft.",
  }),
  p("Laneige Water Bank Blue Hyaluronic Cream", "Laneige", "moisturizers", 3250, {
    img: "cream",
    was: 3650,
    desc: "A rich hyaluronic cream that delivers long-lasting moisture to dry skin.",
  }),
  p("Innisfree Green Tea Seed Hyaluronic Serum", "Innisfree", "serums", 2450, {
    img: "serumAlt",
    bestseller: true,
    desc: "Jeju green tea and hyaluronic acid serum for deep, lasting hydration.",
  }),
  p("Innisfree Volcanic Pore Clay Mask", "Innisfree", "masks", 1450, {
    img: "clayMask",
    desc: "Jeju volcanic clay mask that absorbs excess oil and clears pores.",
  }),
  p("Missha Time Revolution The First Treatment Essence", "Missha", "toners", 2850, {
    img: "tonerAlt",
    desc: "A fermented yeast essence that strengthens and brightens the skin.",
  }),
  p("Missha All Around Safe Block Soft Finish Sun Milk SPF50+", "Missha", "sunscreens", 1450, {
    img: "sunscreen",
    desc: "A silky sun milk with a soft, matte finish — great under makeup.",
  }),
  p("TIRTIR Milk Skin Toner", "TIRTIR", "toners", 1850, {
    img: "toner",
    desc: "A milky toner with rice and milk proteins for a soft, bright complexion.",
  }),

  // Makeup
  p("rom&nd Juicy Lasting Tint", "rom&nd", "lip-tint-lipstick", 1150, {
    img: "lip",
    bestseller: true,
    desc: "The cult glossy tint with a juicy, long-lasting colour and lightweight feel.",
  }),
  p("rom&nd Glasting Water Tint", "rom&nd", "lip-tint-lipstick", 1250, {
    img: "lipsticks",
    trending: true,
    desc: "A glassy water tint that gives lips a plump, shiny finish.",
  }),
  p("rom&nd Better Than Palette", "rom&nd", "eye-makeup", 2650, {
    img: "palette",
    desc: "A 10-shade eyeshadow palette with buttery mattes and sparkling glitters.",
  }),
  p("rom&nd Han All Fix Mascara", "rom&nd", "eye-makeup", 1350, {
    img: "makeupFlatlay",
    desc: "A slim-brush mascara that lifts, curls and holds lashes all day.",
  }),
  p("rom&nd Better Than Cheek", "rom&nd", "blush-highlighter", 1250, {
    img: "powder",
    new: true,
    desc: "A soft, blendable blush for a natural, healthy flush.",
  }),
  p("CLIO Kill Cover Founwear Cushion SPF50+", "CLIO", "cushion-foundation", 3450, {
    img: "powder",
    was: 3850,
    bestseller: true,
    desc: "A full-coverage cushion with a long-wear, semi-matte finish and SPF50+.",
  }),
  p("CLIO Kill Brow Auto Hard Brow Pencil", "CLIO", "eye-makeup", 1150, {
    img: "makeupFlatlay",
    desc: "A hard-texture auto brow pencil for natural, hair-like strokes.",
  }),
  p("CLIO Kill Cover Liquid Concealer", "CLIO", "concealer-primer", 1650, {
    img: "powder",
    desc: "A creamy, high-cover concealer that hides dark circles and blemishes.",
  }),
  p("Peripera Ink Velvet Lip Tint", "Peripera", "lip-tint-lipstick", 950, {
    img: "lipsticks",
    desc: "A velvet-finish lip tint with bold, long-lasting colour.",
  }),
  p("Peripera Ink The Airy Velvet", "Peripera", "lip-tint-lipstick", 1050, {
    img: "lip",
    new: true,
    desc: "An airy, weightless velvet tint that blurs lip lines.",
  }),
  p("Peripera Pure Blushed Sunshine Cheek", "Peripera", "blush-highlighter", 1150, {
    img: "makeupFlatlay",
    desc: "A silky powder blush for a fresh, sunny glow.",
  }),
  p("TIRTIR Mask Fit Red Cushion SPF40", "TIRTIR", "cushion-foundation", 3250, {
    img: "powder",
    trending: true,
    desc: "The viral red cushion — 72-hour wear with a radiant, skin-like finish.",
  }),
  p("TIRTIR Mask Fit Makeup Fixer", "TIRTIR", "concealer-primer", 1850, {
    img: "bottles",
    desc: "A fine-mist setting spray that locks makeup in place for hours.",
  }),
  p("Missha M Perfect Cover BB Cream SPF42", "Missha", "bb-cc-cream", 1450, {
    img: "powder",
    bestseller: true,
    desc: "Korea's classic BB cream — coverage, skincare and sun protection in one.",
  }),
  p("Etude Fixing Tint", "Etude", "lip-tint-lipstick", 1050, {
    img: "lipsticks",
    desc: "A matte, transfer-proof tint with soft, blurred colour.",
  }),
  p("Etude Play Color Eyes Palette", "Etude", "eye-makeup", 2450, {
    img: "paletteAlt",
    desc: "A themed eyeshadow palette with easy, everyday shades.",
  }),
  p("Etude Big Cover Skin Fit Concealer Pro", "Etude", "concealer-primer", 1250, {
    img: "powder",
    desc: "A lightweight concealer that covers spots and redness without creasing.",
  }),
  p("Banila Co Prime Primer Classic", "Banila Co", "concealer-primer", 1850, {
    img: "bottles",
    desc: "A smoothing primer that blurs pores and helps makeup last longer.",
  }),
  p("Laneige Neo Cushion Matte SPF46", "Laneige", "cushion-foundation", 3650, {
    img: "powder",
    desc: "A breathable, matte cushion with buildable coverage and SPF46.",
  }),
  p("Innisfree No-Sebum Mineral Powder", "Innisfree", "concealer-primer", 750, {
    img: "powder",
    bestseller: true,
    desc: "An oil-controlling loose powder that keeps skin fresh and matte all day.",
  }),
  p("TOCOBO Glass Tinted Lip Balm", "TOCOBO", "lip-tint-lipstick", 1350, {
    img: "lip",
    desc: "A nourishing tinted balm that leaves lips glossy and soft.",
  }),
  p("Innisfree Apple Seed Lip & Eye Makeup Remover", "Innisfree", "makeup-remover", 950, {
    img: "bottles",
    desc: "A dual-phase remover that lifts waterproof eye and lip makeup gently.",
  }),
  p("Banila Co Clean It Zero Lip & Eye Remover", "Banila Co", "makeup-remover", 1250, {
    img: "bottles",
    desc: "A non-stinging remover for long-wear lip and eye makeup.",
  }),

  // Hair care
  p("Mise en Scène Perfect Serum Original", "Mise en Scène", "hair-oil-serum", 950, {
    img: "dropper",
    bestseller: true,
    desc: "The best-selling hair serum with 7 oils for smooth, shiny, frizz-free hair.",
  }),
  p("Mise en Scène Damage Care Shampoo", "Mise en Scène", "shampoo", 1150, {
    img: "hairBottles",
    desc: "A protein shampoo that repairs and strengthens damaged hair.",
  }),
  p("Mise en Scène Damage Care Conditioner", "Mise en Scène", "conditioner", 1150, {
    img: "hairBottles",
    desc: "A nourishing conditioner that detangles and softens damaged hair.",
  }),
  p("Ryo Jayang Yoon Mo Anti Hair Loss Shampoo", "Ryo", "shampoo", 1850, {
    img: "hairNatural",
    was: 2150,
    bestseller: true,
    desc: "A ginseng hanbang shampoo that strengthens roots and reduces hair fall.",
  }),
  p("Ryo Deep Cleansing & Cooling Shampoo", "Ryo", "scalp-care", 1650, {
    img: "hairBottles",
    desc: "A cooling shampoo that deep-cleans an oily, itchy scalp.",
  }),
  p("Ryo Hambit Damage Care Conditioner", "Ryo", "conditioner", 1650, {
    img: "hairNatural",
    desc: "A herbal conditioner that restores moisture and shine to dry hair.",
  }),
  p("Masil 8 Seconds Salon Hair Mask", "Masil", "hair-treatment", 1450, {
    img: "jar",
    trending: true,
    desc: "A rinse-off mask that transforms dry, damaged hair in just 8 seconds.",
  }),
  p("Masil 5 Probiotics Perfect Volume Shampoo", "Masil", "shampoo", 1350, {
    img: "hairBottles",
    desc: "A probiotic shampoo that lifts roots for fuller, bouncier hair.",
  }),
  p("Masil 3 Salon Hair CMC Shampoo", "Masil", "shampoo", 1350, {
    img: "hairBottles",
    new: true,
    desc: "A salon-grade shampoo that restores the hair's inner structure.",
  }),
  p("Daeng Gi Meo Ri Ki Gold Energizing Shampoo", "Daeng Gi Meo Ri", "shampoo", 1750, {
    img: "hairNatural",
    desc: "A traditional herbal shampoo that energises the scalp and roots.",
  }),
  p("Daeng Gi Meo Ri Vitalizing Scalp Pack", "Daeng Gi Meo Ri", "scalp-care", 1950, {
    img: "jar",
    desc: "A herbal scalp pack that balances and revitalises the scalp.",
  }),
  p("Daeng Gi Meo Ri Honey Intensive Hair Treatment", "Daeng Gi Meo Ri", "hair-treatment", 1550, {
    img: "jar",
    desc: "A honey and herbal treatment that deeply nourishes dry, brittle hair.",
  }),
  p("Some By Mi Cica Peptide Anti Hair Loss Shampoo", "Some By Mi", "scalp-care", 1650, {
    img: "hairBottles",
    desc: "A cica and peptide shampoo that soothes the scalp and reduces hair fall.",
  }),

  // Bath & body
  p("Illiyoon Ceramide Ato Lotion", "Illiyoon", "body-lotion", 1850, {
    img: "bottles",
    bestseller: true,
    desc: "A ceramide body lotion that relieves very dry, itchy skin — safe for the whole family.",
  }),
  p("Illiyoon Ceramide Ato 6.0 Top to Toe Wash", "Illiyoon", "body-wash", 1650, {
    img: "bath",
    desc: "A mild, low-pH wash for face, body and hair, gentle enough for babies.",
  }),
  p("Happy Bath Natural Real Mild Body Wash", "Happy Bath", "body-wash", 1150, {
    img: "bath",
    desc: "A creamy, lightly fragranced body wash that leaves skin soft and moisturised.",
  }),
  p("Happy Bath Perfume Body Scrub", "Happy Bath", "body-scrub", 1250, {
    img: "jar",
    new: true,
    desc: "A fragrant sugar scrub that polishes away dry, rough skin.",
  }),
  p("Happy Bath Moisture Body Lotion", "Happy Bath", "body-lotion", 1250, {
    img: "bottles",
    desc: "A fast-absorbing body lotion with a fresh, clean scent.",
  }),
  p("Innisfree Jeju Life Perfumed Hand Cream", "Innisfree", "hand-foot-care", 650, {
    img: "jar",
    desc: "A non-greasy hand cream with Jeju-inspired fragrances.",
  }),

  // Men's care
  p("Innisfree Forest For Men Oil Control Foam", "Innisfree", "mens-face-wash", 1150, {
    img: "mens",
    desc: "A deep-cleansing foam that removes oil and sweat from men's skin.",
  }),
  p("Innisfree Forest For Men Moisture All-in-One Essence", "Innisfree", "mens-moisturizer", 1850, {
    img: "mens",
    desc: "A one-step toner, serum and moisturiser for simple daily care.",
  }),
  p("Innisfree Forest For Men Skin Care Set", "Innisfree", "mens-sets", 3450, {
    img: "mens",
    was: 3950,
    desc: "Foam cleanser, toner and lotion — a complete routine in one box.",
  }),
  p("Anua Heartleaf Quercetinol Pore Deep Cleansing Foam", "Anua", "mens-face-wash", 1450, {
    img: "cleanser",
    desc: "A heartleaf foam that deep-cleans pores and calms oily, acne-prone skin.",
  }),

  // Sets & gifts
  p("Laneige Lip Sleeping Mask Mini Set", "Laneige", "travel-kits", 2250, {
    img: "lip",
    new: true,
    desc: "Four travel-size lip sleeping masks in best-loved flavours.",
  }),
  p("K-Beauty Glow Gift Box", null, "gift-boxes", 4950, {
    img: "setAlt",
    was: 5650,
    featured: true,
    desc: "A curated box of cleanser, toner, serum and sunscreen — a perfect gift.",
  }),
  p("Beauty of Joseon Sun & Glow Gift Duo", "Beauty of Joseon", "gift-boxes", 3450, {
    img: "set",
    desc: "Relief Sun and Glow Serum together in a gift-ready box.",
  }),

  // Beauty tools
  p("Rose Quartz Face Roller & Gua Sha Set", null, "face-roller-gua-sha", 1250, {
    img: "tools",
    trending: true,
    desc: "A cooling rose quartz roller and gua sha to de-puff and sculpt.",
  }),
  p("Jade Gua Sha Facial Stone", null, "face-roller-gua-sha", 750, {
    img: "tools",
    desc: "A smooth jade gua sha for lymphatic facial massage.",
  }),
  p("Fillimilli Air Cushion Puff (2 pcs)", "Fillimilli", "makeup-tools", 450, {
    img: "powder",
    desc: "Soft, bouncy puffs for a smooth, even cushion application.",
  }),
  p("Fillimilli Multi Blending Brush", "Fillimilli", "makeup-tools", 950, {
    img: "makeupFlatlay",
    desc: "A dense blending brush for foundation, blush and contour.",
  }),
  p("Fillimilli Premium Cotton Pads (80 pcs)", "Fillimilli", "cotton-pads", 350, {
    img: "facial",
    desc: "Soft, lint-free cotton pads for toner and makeup removal.",
  }),
];

/** How-to-use text by top-level category, used when a product doesn't have its own. */
export const HOW_TO_USE = {
  "skin-care":
    "Apply to clean skin as directed, morning and/or evening. Always finish your morning routine with sunscreen.",
  makeup: "Apply to clean, moisturised skin. Build up in thin layers for more coverage or colour.",
  "hair-care": "Apply to wet or damp hair as directed, massage gently, then rinse or style.",
  "bath-body": "Use daily in the shower or apply to clean skin, focusing on dry areas.",
  "mens-care": "Use morning and evening on clean skin.",
  "sets-gifts": "Follow the steps printed on each product in the set.",
  "beauty-tools": "Clean before and after each use. Store in a dry place.",
};

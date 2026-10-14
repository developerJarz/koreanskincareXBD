/**
 * Starter catalog used by scripts/seed-catalog.mjs: a Shajgoj-style category tree, Korean beauty
 * brands. Everything here only fills gaps — once a record exists, the admin
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

// Products are added through the product editor; no demo products are seeded.
export const PRODUCTS = [];

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

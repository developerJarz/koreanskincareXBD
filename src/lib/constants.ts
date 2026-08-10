// ─── Bangladesh Administrative Data ───

export const BD_DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
] as const;

export const BD_DISTRICTS: Record<string, string[]> = {
  Dhaka: [
    "Dhaka",
    "Faridpur",
    "Gazipur",
    "Gopalganj",
    "Kishoreganj",
    "Madaripur",
    "Manikganj",
    "Munshiganj",
    "Narayanganj",
    "Narsingdi",
    "Rajbari",
    "Shariatpur",
    "Tangail",
  ],
  Chattogram: [
    "Chattogram",
    "Bandarban",
    "Brahmanbaria",
    "Chandpur",
    "Comilla",
    "Cox's Bazar",
    "Feni",
    "Khagrachhari",
    "Lakshmipur",
    "Noakhali",
    "Rangamati",
  ],
  Rajshahi: [
    "Rajshahi",
    "Bogra",
    "Chapainawabganj",
    "Joypurhat",
    "Naogaon",
    "Natore",
    "Nawabganj",
    "Pabna",
    "Sirajganj",
  ],
  Khulna: [
    "Khulna",
    "Bagerhat",
    "Chuadanga",
    "Jessore",
    "Jhenaidah",
    "Kushtia",
    "Magura",
    "Meherpur",
    "Narail",
    "Satkhira",
  ],
  Barishal: [
    "Barishal",
    "Barguna",
    "Bhola",
    "Jhalokathi",
    "Patuakhali",
    "Pirojpur",
  ],
  Sylhet: ["Sylhet", "Habiganj", "Moulvibazar", "Sunamganj"],
  Rangpur: [
    "Rangpur",
    "Dinajpur",
    "Gaibandha",
    "Kurigram",
    "Lalmonirhat",
    "Nilphamari",
    "Panchagarh",
    "Thakurgaon",
  ],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

// ─── Order Status Labels & Colors ───
export const ORDER_STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f59e0b" },
  confirmed: { label: "Confirmed", color: "#3b82f6" },
  processing: { label: "Processing", color: "#8b5cf6" },
  shipped: { label: "Shipped", color: "#6366f1" },
  delivered: { label: "Delivered", color: "#10b981" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  returned: { label: "Returned", color: "#f97316" },
  refunded: { label: "Refunded", color: "#6b7280" },
} as const;

export const PAYMENT_STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f59e0b" },
  paid: { label: "Paid", color: "#10b981" },
  failed: { label: "Failed", color: "#ef4444" },
  refunded: { label: "Refunded", color: "#6b7280" },
  partially_refunded: { label: "Partially Refunded", color: "#f97316" },
} as const;

// ─── Product Status ───
export const PRODUCT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

// ─── Pagination ───
export const DEFAULT_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;

// ─── Cloudinary ───
export const CLOUDINARY_FOLDERS = {
  products: "noors/products",
  categories: "noors/categories",
  brands: "noors/brands",
  banners: "noors/banners",
  blog: "noors/blog",
  avatars: "noors/avatars",
} as const;

// ─── Currency ───
export const CURRENCY = {
  code: "BDT",
  symbol: "৳",
  name: "Bangladeshi Taka",
} as const;

// ─── Common Product Attributes ───
export const COMMON_COLORS = [
  { name: "Rose Gold", hex: "#B76E79" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Blush", hex: "#DE5D83" },
  { name: "Navy", hex: "#000080" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Champagne", hex: "#F7E7CE" },
] as const;

export const COMMON_SIZES = [
  "One Size",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
] as const;

export const COMMON_MATERIALS = [
  "Sterling Silver",
  "Gold Plated",
  "Rose Gold Plated",
  "Stainless Steel",
  "Leather",
  "Faux Leather",
  "Crystal",
  "Pearl",
  "Cubic Zirconia",
  "Silk",
  "Cotton",
] as const;

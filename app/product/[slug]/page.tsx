"use client";

import Link from "next/link";
import {
  ChevronRight,
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
  Check,
  Minus,
  Plus,
  Gift,
  Share2,
  Eye,
  Zap,
  Sparkles,
} from "lucide-react";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PRODUCTS, type Product } from "@/lib/site-data";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { mapDbProduct, toCartItem } from "@/lib/product-utils";
import { getImageSrc } from "@/lib/image";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = use(params);
  const resolvedSlug = decodeURIComponent(slug);
  const rawProduct = PRODUCTS.find((product) => product.slug === resolvedSlug) || PRODUCTS[0];
  const p = mapDbProduct(rawProduct);

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>(p.colors?.[0] || "Standard Edition");
  const [selectedSize, setSelectedSize] = useState<string>(p.sizes?.[0] || "One Size");
  const [activeImage, setActiveImage] = useState(getImageSrc(p.img));
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "shipping" | "care">("details");
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);

  const related = useMemo(
    () =>
      PRODUCTS.filter((item) => item.category === p.category && item.slug !== p.slug).slice(0, 4),
    [p.category, p.slug],
  );

  const trendingProducts = useMemo(
    () =>
      PRODUCTS.filter((item) => item.slug !== p.slug).slice(0, 4),
    [p.slug],
  );

  const handleAddToCart = () => {
    addItem({
      ...toCartItem(p, quantity),
      variant: {
        sku: `${p.slug}-${selectedColor}`,
        color: selectedColor !== "Standard Edition" ? selectedColor : undefined,
        size: selectedSize !== "One Size" ? selectedSize : undefined,
      },
    });
    openCart();
    toast.success(`${p.name} added to your shopping bag!`);
  };

  const handleBuyNow = () => {
    addItem({
      ...toCartItem(p, quantity),
      variant: {
        sku: `${p.slug}-${selectedColor}`,
        color: selectedColor !== "Standard Edition" ? selectedColor : undefined,
        size: selectedSize !== "One Size" ? selectedSize : undefined,
      },
    });
    router.push("/checkout");
  };

  const handleToggleWishlist = () => {
    setIsWishlisted((prev) => !prev);
    if (!isWishlisted) {
      toast.success(`${p.name} saved to your wishlist`);
    } else {
      toast.info("Removed from wishlist");
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  const discountPercent = p.was && p.was > p.price ? Math.round(((p.was - p.price) / p.was) * 100) : 0;

  return (
    <div className="bg-background min-h-screen">
      {/* Sleek Breadcrumb Bar */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container-x py-3.5 text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link href="/shop" className="hover:text-primary transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link
            href={`/shop?category=${encodeURIComponent(p.categorySlug || p.category)}`}
            className="capitalize hover:text-primary transition-colors"
          >
            {p.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
            {p.name}
          </span>
        </div>
      </div>

      <main className="container-x py-8 lg:py-14">
        {/* Luxury 2-Column Product Showcase */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* LEFT: Interactive Product Gallery (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-secondary aspect-[4/5] border border-border shadow-md group">
              <img
                src={activeImage}
                alt={p.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Tag Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {p.tag && (
                  <span className="bg-background/95 backdrop-blur text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full font-bold shadow-sm border border-border/50 text-foreground">
                    {p.tag}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Share & Wishlist Floating Action */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border flex items-center justify-center hover:text-primary hover:bg-background transition shadow-sm"
                  aria-label="Share product"
                  title="Copy link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border flex items-center justify-center transition shadow-sm ${
                    isWishlisted ? "text-rose-500 fill-rose-500" : "hover:text-primary"
                  }`}
                  aria-label="Add to wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-primary font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>Handcrafted Quality Guarantee</span>
                </div>
                <span className="text-muted-foreground">SKU: {p.slug}</span>
              </div>
            </div>

            {/* Thumbnail Carousel */}
            {p.images && p.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {p.images.map((image, index) => {
                  const source = getImageSrc(image);
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveImage(source)}
                      className={`w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-200 shrink-0 ${
                        activeImage === source
                          ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                          : "border-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={source} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Product Information & Buying Options (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Category & Live Views Badge */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
                {p.category}
              </span>
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full font-medium">
                <Eye className="w-3.5 h-3.5 animate-pulse" />
                <span>16 shoppers viewing now</span>
              </div>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">
                {p.name}
              </h1>

              {/* Reviews & Stock Status */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="w-4 h-4 fill-primary" />
                  ))}
                  <span className="font-bold text-foreground ml-1">4.9</span>
                </div>
                <span className="text-muted-foreground">• 48 Verified Reviews</span>
                <span className="text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> In Stock (Dhaka Hub)
                </span>
              </div>
            </div>

            {/* Price Box with Clean Font */}
            <div className="p-5 rounded-2xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-foreground">
                  ৳{p.price.toLocaleString()}
                </span>
                {p.was && (
                  <span className="text-lg text-muted-foreground line-through font-sans">
                    ৳{p.was.toLocaleString()}
                  </span>
                )}
                {p.was && (
                  <span className="bg-destructive/15 text-destructive text-xs font-bold px-2.5 py-1 rounded-full">
                    Save ৳{(p.was - p.price).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Price includes all local taxes. Free delivery on orders over ৳2,000.
              </p>
            </div>

            {/* Product Short Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {p.description ||
                `Thoughtfully designed ${p.name.toLowerCase()} crafted for modern elegance. Hand-finished with durable luxury plating, lightweight wearability, and delivered in signature Noors packaging.`}
            </p>

            {/* Color Option Selector */}
            {p.colors && p.colors.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">
                    Color Finish: <span className="text-primary">{selectedColor}</span>
                  </span>
                  <span className="text-muted-foreground">Select one</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-xl text-xs border font-medium transition-all ${
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:bg-accent text-foreground"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold block text-foreground">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-2xl bg-card p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:text-primary transition rounded-xl"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold font-sans">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 hover:text-primary transition rounded-xl"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                  <span className="font-sans font-bold ml-1">
                    — ৳{(p.price * quantity).toLocaleString()}
                  </span>
                </button>
              </div>

              {/* Instant Buy Now Button */}
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 px-6 rounded-2xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Buy Now with Cash on Delivery</span>
              </button>
            </div>

            {/* Key Delivery & Trust Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
              <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">Fast Delivery</p>
                  <p className="text-[11px] text-muted-foreground">1-2 days Dhaka, 2-3 days Nationwide</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">7-Day Exchange</p>
                  <p className="text-[11px] text-muted-foreground">Hassle-free size or defect replacement</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">100% Genuine</p>
                  <p className="text-[11px] text-muted-foreground">Premium tarnish-resistant finish</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-start gap-2.5">
                <Gift className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">Luxury Box</p>
                  <p className="text-[11px] text-muted-foreground">Signature branded gift packing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs Section (Specs, Customer Reviews, Delivery Policy) */}
        <div className="mt-16 border-t border-border pt-10">
          <div className="flex border-b border-border gap-4 sm:gap-8 text-sm font-medium overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "details"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Product Details & Specs
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "reviews"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer Reviews (48)
            </button>
            <button
              onClick={() => setActiveTab("shipping")}
              className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "shipping"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Shipping & Cash on Delivery
            </button>
            <button
              onClick={() => setActiveTab("care")}
              className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "care"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Care & Maintenance
            </button>
          </div>

          <div className="py-8 text-sm text-muted-foreground leading-relaxed max-w-4xl">
            {activeTab === "details" && (
              <div className="space-y-6">
                <p>
                  Every piece in the Noors.bd collection is inspected individually for perfection in
                  metal plating, stitching, and finishing. Designed for modern Bangladeshi women who
                  appreciate understated elegance and enduring durability.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Material
                    </span>
                    <p className="text-foreground font-medium">Premium Grade Alloy / Anti-Tarnish Coating</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Weight & Feel
                    </span>
                    <p className="text-foreground font-medium">Lightweight, comfortable for all-day wear</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Packaging
                    </span>
                    <p className="text-foreground font-medium">Custom luxury jewelry pouch & branded gift box</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Origin & Craft
                    </span>
                    <p className="text-foreground font-medium">Curated & quality-certified in Dhaka, Bangladesh</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-secondary/40 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex gap-1 text-primary mb-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className="w-4 h-4 fill-primary" />
                        ))}
                      </div>
                      <p className="font-semibold text-foreground">"Absolutely in love with this piece!"</p>
                    </div>
                    <span className="text-xs text-muted-foreground">3 days ago</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Ordered for my sister's birthday and she was thrilled. The packaging felt like an
                    international luxury house and delivery took just 24 hours in Dhanmondi.
                  </p>
                  <p className="text-xs text-foreground font-medium">— Mehzabin A., Verified Buyer (Dhaka)</p>
                </div>

                <div className="p-6 rounded-3xl bg-secondary/40 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex gap-1 text-primary mb-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className="w-4 h-4 fill-primary" />
                        ))}
                      </div>
                      <p className="font-semibold text-foreground">"Superb finishing and fast COD delivery"</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1 week ago</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Very impressed with the color sheen and weight. It looks even more expensive in person.
                    The rider allowed me to verify before payment.
                  </p>
                  <p className="text-xs text-foreground font-medium">— Nusrat K., Verified Buyer (Chattogram)</p>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <h4 className="font-semibold text-foreground mb-1">Inside Dhaka Metropolitan:</h4>
                  <p className="text-xs">
                    Standard Delivery: 24 to 48 hours (৳70 delivery fee, <strong>FREE on orders above ৳2,000</strong>).
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <h4 className="font-semibold text-foreground mb-1">Outside Dhaka (All 64 Districts):</h4>
                  <p className="text-xs">
                    SteadFast / Pathao Courier: 48 to 72 hours (৳120 delivery fee with Cash on Delivery).
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <h4 className="font-semibold text-foreground mb-1">Inspection & Return Policy:</h4>
                  <p className="text-xs">
                    You can open and inspect the item in front of the delivery partner. We offer a 7-day
                    replacement guarantee for any size or manufacturing discrepancy.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "care" && (
              <div className="space-y-3">
                <p>To preserve the pristine luster and protective coating of your accessories:</p>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li>Avoid direct exposure to perfume, hairsprays, and harsh detergents.</li>
                  <li>Store in the provided airtight Noors pouch when not in use.</li>
                  <li>Gently wipe with a soft microfibre cloth after wearing to remove moisture.</li>
                  <li>Remove before swimming, exercising, or bathing.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* You Might Also Like Section */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-border pt-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Curated Matches</p>
                <h2 className="font-serif text-3xl lg:text-4xl mt-1">Complete Your Look</h2>
              </div>
              <Link href="/shop" className="text-xs font-semibold text-primary hover:underline">
                Explore full catalog →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((item) => (
                <ProductCard key={item.slug} p={item} />
              ))}
            </div>
          </div>
        )}

        {/* Trending Across Bangladesh */}
        {trendingProducts.length > 0 && (
          <div className="mt-16 border-t border-border pt-14">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Trending Right Now</p>
              <h2 className="font-serif text-3xl lg:text-4xl mt-1">Most Loved This Week</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {trendingProducts.map((item) => (
                <ProductCard key={item.slug} p={item} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

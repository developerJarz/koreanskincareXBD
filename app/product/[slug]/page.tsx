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
  Layers,
  FlaskConical,
  Award,
  Clock,
  ThumbsUp,
} from "lucide-react";
import { use, useEffect, useMemo, useState } from "react";
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

  // Local fallback + state for API data
  const staticProduct = PRODUCTS.find((product) => product.slug === resolvedSlug) || PRODUCTS[0];
  const [productData, setProductData] = useState<Product>(staticProduct);
  const [activeTab, setActiveTab] = useState<"routine" | "ingredients" | "reviews" | "shipping">(
    "routine",
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("Standard (100ml)");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);

  // Fetch live product data from API
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveProduct() {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(resolvedSlug)}`, {
          cache: "no-store",
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data?.product) {
            setProductData(mapDbProduct(data.product));
          }
        }
      } catch (e) {
        console.warn("Using fallback local product data:", e);
      }
    }
    fetchLiveProduct();
    return () => {
      isMounted = false;
    };
  }, [resolvedSlug]);

  const p = mapDbProduct(productData);

  // Gallery images array
  const galleryImages = useMemo(() => {
    if (p.images && p.images.length > 0) {
      return p.images.map((img) => getImageSrc(img));
    }
    return [getImageSrc(p.img)];
  }, [p.images, p.img]);

  const currentActiveImage = galleryImages[activeImageIndex] || galleryImages[0];

  // Size variants
  const sizeOptions = useMemo(() => {
    if (p.sizes && p.sizes.length > 0) return p.sizes;
    return ["Standard Edition (100ml)", "Jumbo Size (150ml)"];
  }, [p.sizes]);

  useEffect(() => {
    setSelectedSize(sizeOptions[0]);
  }, [sizeOptions]);

  // Related routine products
  const related = useMemo(
    () =>
      PRODUCTS.filter((item) => item.category === p.category && item.slug !== p.slug).slice(0, 4),
    [p.category, p.slug],
  );

  const routineSuggestions = useMemo(
    () => PRODUCTS.filter((item) => item.slug !== p.slug).slice(0, 4),
    [p.slug],
  );

  const discountPercent =
    p.was && p.was > p.price ? Math.round(((p.was - p.price) / p.was) * 100) : 0;

  const handleAddToCart = () => {
    addItem({
      ...toCartItem(p, quantity),
      variant: {
        sku: `${p.slug}-${selectedSize}`,
        size: selectedSize,
      },
    });
    openCart();
    toast.success(`${p.name} added to your shopping bag!`);
  };

  const handleBuyNow = () => {
    addItem({
      ...toCartItem(p, quantity),
      variant: {
        sku: `${p.slug}-${selectedSize}`,
        size: selectedSize,
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

  return (
    <div className="bg-background min-h-screen">
      {/* Breadcrumb Bar */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container-x py-3 text-xs text-muted-foreground flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
          <Link href="/shop" className="hover:text-primary transition-colors">
            Shop K-Beauty
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
          <Link
            href={`/shop?category=${encodeURIComponent(p.categorySlug || p.category)}`}
            className="capitalize hover:text-primary transition-colors"
          >
            {p.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
          <span className="text-foreground font-semibold truncate max-w-[240px] sm:max-w-none">
            {p.name}
          </span>
        </div>
      </div>

      <main className="container-x py-8 lg:py-12">
        {/* Product Hero Layout */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* LEFT: Multi-Angle Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-secondary aspect-[4/5] border border-border shadow-md group">
              <img
                src={currentActiveImage}
                alt={p.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Tag Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {p.tag && (
                  <span className="bg-primary text-primary-foreground text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full font-bold shadow-sm">
                    {p.tag}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
                <span className="bg-emerald-600/90 backdrop-blur text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Authentic Korean Import
                </span>
              </div>

              {/* Share & Wishlist */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border flex items-center justify-center hover:text-primary hover:bg-background transition shadow-sm"
                  aria-label="Share product"
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
                  <Heart
                    className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
                  />
                </button>
              </div>

              {/* Bottom Guarantee Banner */}
              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-primary font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>Direct Seoul Import • Batch Code Verified</span>
                </div>
                <span className="text-muted-foreground font-mono">SKU: {p.slug}</span>
              </div>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {galleryImages.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-200 shrink-0 ${
                      activeImageIndex === idx
                        ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Specs & Buy Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Category & Live Views */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
                {p.category}
              </span>
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full font-medium">
                <Eye className="w-3.5 h-3.5 animate-pulse" />
                <span>18 shoppers viewing now</span>
              </div>
            </div>

            {/* Product Title & Reviews */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-foreground font-normal">
                {p.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="w-4 h-4 fill-primary" />
                  ))}
                  <span className="font-bold text-foreground ml-1">{p.rating || 4.9}</span>
                </div>
                <span className="text-muted-foreground">• 84 Verified Buyer Reviews</span>
                <span className="text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> In Stock (Dhaka Warehouse)
                </span>
              </div>
            </div>

            {/* Price Card */}
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
                All prices inclusive of VAT. Free delivery on orders over ৳2,000.
              </p>
            </div>

            {/* Short Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {p.description ||
                `Authentic Korean ${p.name.toLowerCase()} formulated for radiant, healthy glass skin. Clinically tested, gentle on sensitive skin, and sealed with 100% genuine import guarantee.`}
            </p>

            {/* Size / Volume Variants */}
            {sizeOptions.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">
                    Bottle Size: <span className="text-primary">{selectedSize}</span>
                  </span>
                  <span className="text-muted-foreground">Select volume</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-xl text-xs border font-medium transition-all ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:bg-accent text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Urgency Indicator */}
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/20">
              <Clock className="w-4 h-4 shrink-0 animate-pulse" />
              <span>
                Low stock alert: Only <strong>4 units</strong> left in Dhaka hub. Order within 2
                hours for same-day dispatch.
              </span>
            </div>

            {/* Quantity Stepper & Buttons */}
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
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
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

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
              <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">100% Authentic</p>
                  <p className="text-[11px] text-muted-foreground">Imported directly from Seoul</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">Dhaka Express</p>
                  <p className="text-[11px] text-muted-foreground">
                    24h Dhaka, 48h All 64 Districts
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">7-Day Return</p>
                  <p className="text-[11px] text-muted-foreground">Hassle-free exchange policy</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-start gap-2.5">
                <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">Clinically Tested</p>
                  <p className="text-[11px] text-muted-foreground">Safe for sensitive skin</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skincare Routine & Ingredients Tabbed Section */}
        <div className="mt-16 border-t border-border pt-10">
          <div className="flex border-b border-border gap-4 sm:gap-8 text-sm font-medium overflow-x-auto pb-px scrollbar-none">
            <button
              onClick={() => setActiveTab("routine")}
              className={`pb-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "routine"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>K-Beauty Routine Guide</span>
            </button>
            <button
              onClick={() => setActiveTab("ingredients")}
              className={`pb-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "ingredients"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Key Active Ingredients</span>
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "reviews"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Verified Customer Reviews (84)</span>
            </button>
            <button
              onClick={() => setActiveTab("shipping")}
              className={`pb-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "shipping"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Delivery & COD Policy</span>
            </button>
          </div>

          <div className="py-8 text-sm text-muted-foreground leading-relaxed max-w-4xl">
            {activeTab === "routine" && (
              <div className="space-y-6">
                <p className="text-foreground font-medium">
                  Follow the classic 5-Step Korean Skincare Method for luminous, bouncy glass skin:
                </p>
                <div className="grid sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Step 1
                    </span>
                    <p className="text-xs font-bold text-foreground">Double Cleanse</p>
                    <p className="text-[11px] text-muted-foreground">Melt SPF & impurities</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Step 2
                    </span>
                    <p className="text-xs font-bold text-foreground">Toner</p>
                    <p className="text-[11px] text-muted-foreground">Balance skin pH</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Step 3
                    </span>
                    <p className="text-xs font-bold text-primary">This Product</p>
                    <p className="text-[11px] text-foreground font-medium">Targeted essence</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Step 4
                    </span>
                    <p className="text-xs font-bold text-foreground">Moisturizer</p>
                    <p className="text-[11px] text-muted-foreground">Lock hydration barrier</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Step 5
                    </span>
                    <p className="text-xs font-bold text-foreground">Sunscreen (AM)</p>
                    <p className="text-[11px] text-muted-foreground">UV Shield SPF 50+</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
                  <h4 className="font-semibold text-foreground mb-1 text-xs uppercase tracking-wider">
                    How to Apply:
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    After cleansing and toning, dispense 2–3 pumps onto palms and gently press onto
                    the face and neck. Pat lightly using fingertips until fully absorbed. Suitable
                    for both AM and PM routines.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="space-y-6">
                <p>
                  Formulated with dermatologist-approved active botanicals. 100% Free of artificial
                  fragrances, parabens, drying alcohols, mineral oils, and sulfates.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <span className="text-xs text-primary uppercase font-bold tracking-wider">
                      Key Active 1
                    </span>
                    <p className="text-foreground font-semibold">High-Concentration Botanicals</p>
                    <p className="text-xs text-muted-foreground">
                      Deeply replenishes moisture layers and soothes redness.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <span className="text-xs text-primary uppercase font-bold tracking-wider">
                      Key Active 2
                    </span>
                    <p className="text-foreground font-semibold">Niacinamide & Hyaluronic Acid</p>
                    <p className="text-xs text-muted-foreground">
                      Strengthens the skin barrier and provides luminous brightening.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <span className="text-xs text-primary uppercase font-bold tracking-wider">
                      Skin Type Match
                    </span>
                    <p className="text-foreground font-semibold">All Skin Types</p>
                    <p className="text-xs text-muted-foreground">
                      Specially formulated for sensitive, dehydrated, and acne-prone skin.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <span className="text-xs text-primary uppercase font-bold tracking-wider">
                      Safety & Certifications
                    </span>
                    <p className="text-foreground font-semibold">EWG Green Grade • Cruelty-Free</p>
                    <p className="text-xs text-muted-foreground">
                      Non-comedogenic, hypoallergenic, and certified Korean GMP standards.
                    </p>
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
                      <p className="font-semibold text-foreground">
                        "Transformed my skin barrier within 2 weeks!"
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">Verified Buyer • Dhaka</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    I have sensitive combination skin that breaks out easily. This product absorbed
                    completely without any tackiness and made my skin super hydrated. 100% authentic
                    Korean import, arrived in less than 24 hours.
                  </p>
                  <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-primary" />
                    <span>— Sadia Rahman (Dhanmondi, Dhaka)</span>
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-secondary/40 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex gap-1 text-primary mb-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className="w-4 h-4 fill-primary" />
                        ))}
                      </div>
                      <p className="font-semibold text-foreground">
                        "Best price and authentic batch in Bangladesh"
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Verified Buyer • Chattogram
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Checked the batch QR code on the box and it's genuine direct from Seoul. Great
                    customer care and cash on delivery was super smooth.
                  </p>
                  <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-primary" />
                    <span>— Tanvir Hossain (Agrabad, Chattogram)</span>
                  </p>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <h4 className="font-semibold text-foreground mb-1">Inside Dhaka Metropolitan:</h4>
                  <p className="text-xs">
                    Express 24-Hour Delivery (৳70 fee, <strong>FREE on orders above ৳2,000</strong>
                    ).
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <h4 className="font-semibold text-foreground mb-1">
                    Outside Dhaka (All 64 Districts):
                  </h4>
                  <p className="text-xs">
                    SteadFast / Pathao Courier: 48 to 72 hours (৳120 fee with Cash on Delivery).
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <h4 className="font-semibold text-foreground mb-1">
                    Open Box Inspection Guarantee:
                  </h4>
                  <p className="text-xs">
                    You can open and inspect the security seals in front of the delivery partner. We
                    offer 7-day hassle-free replacements for any verified issue.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete the K-Beauty Routine */}
        {routineSuggestions.length > 0 && (
          <div className="mt-16 border-t border-border pt-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
                  Recommended Routine Pairings
                </p>
                <h2 className="font-serif text-3xl lg:text-4xl mt-1">
                  Complete Your K-Beauty Routine
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-xs font-semibold text-primary hover:underline hidden sm:block"
              >
                Browse all products →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {routineSuggestions.map((item) => (
                <ProductCard key={item.slug} p={item} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  TrendingUp,
  Share2,
  FileText,
  Wand2,
  Layers,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";

export function AiStudioModule() {
  const [activeAiTab, setActiveAiTab] = useState<"copy" | "seo" | "ads" | "insights" | "image">(
    "copy",
  );

  // Copywriter State
  const [productName, setProductName] = useState("Emerald Velvet Handbag");
  const [productTone, setProductTone] = useState("Luxury & Elegant");
  const [generatedCopy, setGeneratedCopy] = useState(
    "Crafted for the modern woman of Dhaka, the Emerald Velvet Handbag marries timeless vintage allure with everyday poise. Hand-finished with gold-toned metal accents, waterproof lining, and a spacious compartment for daily essentials. Whether for festive Eid evenings or corporate boardrooms, make an indelible statement.",
  );
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  // SEO Optimizer State
  const [seoTargetKeyword, setSeoTargetKeyword] = useState("luxury skincare bangladesh");
  const [generatedMetaTitle, setGeneratedMetaTitle] = useState(
    "Buy Authentic Korean Skincare Online in Bangladesh | koreanskincare.bd",
  );
  const [generatedMetaDesc, setGeneratedMetaDesc] = useState(
    "Discover authentic Korean skincare at koreanskincare.bd. Handcrafted with premium ingredients and radiant finish. Fast 24-hr Cash on Delivery all over Bangladesh.",
  );

  // Ad Copy State
  const [generatedAdCopy, setGeneratedAdCopy] = useState(
    `✨ Discover Authentic Korean Skincare at koreanskincare.bd ✨\n\nElevate your signature glow with our curated Korean Skincare Collection. 100% authentic with 7-day exchange guarantee and Cash on Delivery across all 64 districts in Bangladesh!\n\n🛍️ Shop Now at koreanskincare.bd\n🎁 Special Offer: Use code KOREAN10 for 10% OFF!\n\n#KoreanSkincareBD #KBeautyBD #DhakaGlow #BangladeshSkincare #AuthenticKBeauty2026`,
  );

  // Image Studio State
  const [bgStyle, setBgStyle] = useState<
    "studio_white" | "luxury_marble" | "warm_sand" | "rose_glow"
  >("studio_white");
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  const handleGenerateCopy = () => {
    setIsGeneratingCopy(true);
    setTimeout(() => {
      setIsGeneratingCopy(false);
      setGeneratedCopy(
        `Exquisitely curated for contemporary Bangladeshi lifestyles, the ${productName} blends minimalist luxury with nourishing skincare perfection. Featuring dermatologist-tested formulations, lightweight texture, and delivered in our signature koreanskincare.bd luxury pouch. Perfect for everyday radiant beauty.`,
      );
      toast.success("AI Product Description generated!");
    }, 900);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <h2 className="font-serif text-2xl font-bold">AI Studio & Intelligence Engine</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate high-converting Bangladeshi e-commerce copy, SEO tags, ads & sales insights
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-secondary p-1 rounded-2xl border border-border text-xs">
          {(["copy", "seo", "ads", "insights", "image"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveAiTab(tabKey)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition ${
                activeAiTab === tabKey
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tabKey === "copy" && "Copywriter"}
              {tabKey === "seo" && "SEO Tags"}
              {tabKey === "ads" && "Ad Copy"}
              {tabKey === "insights" && "BI Insights"}
              {tabKey === "image" && "Image Studio"}
            </button>
          ))}
        </div>
      </div>

      {/* 1. AI Copywriter Subview */}
      {activeAiTab === "copy" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-lg">Product Description Generator</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Brand Tone</label>
                <select
                  value={productTone}
                  onChange={(e) => setProductTone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
                >
                  <option>Luxury & Elegant</option>
                  <option>Festive & Eid Glamour</option>
                  <option>Trendy & Gen-Z Appeal</option>
                  <option>Minimalist & Modern</option>
                </select>
              </div>

              <button
                onClick={handleGenerateCopy}
                disabled={isGeneratingCopy}
                className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                {isGeneratingCopy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>Generate E-Commerce Copy</span>
              </button>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Generated Description
                </span>
                <button
                  onClick={() => handleCopyText(generatedCopy)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-xs text-foreground mt-4 leading-relaxed font-sans bg-secondary/30 p-4 rounded-2xl border border-border">
                {generatedCopy}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tailored for high conversion on Bangladeshi social commerce & storefronts
            </p>
          </div>
        </div>
      )}

      {/* 2. AI SEO Subview */}
      {activeAiTab === "seo" && (
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">AI SEO Title & Meta Generator</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
              Google Serps 2026 Ready
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Target Search Keyword</label>
              <input
                type="text"
                value={seoTargetKeyword}
                onChange={(e) => setSeoTargetKeyword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background focus:outline-hidden"
              />
            </div>

            {/* Google Search Snippet Preview */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1">
              <span className="text-[10px] text-muted-foreground">
                Google Search Result Preview:
              </span>
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {generatedMetaTitle}
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                https://koreanskincare.bd › product › emerald-handbag
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{generatedMetaDesc}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. AI Social Media & Ad Copy */}
      {activeAiTab === "ads" && (
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Facebook & Instagram Ad Copy Generator</h3>
            <button
              onClick={() => handleCopyText(generatedAdCopy)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Ad Copy</span>
            </button>
          </div>

          <textarea
            rows={8}
            value={generatedAdCopy}
            onChange={(e) => setGeneratedAdCopy(e.target.value)}
            className="w-full p-4 rounded-2xl border border-border bg-background text-xs font-mono leading-relaxed focus:outline-hidden"
          />
        </div>
      )}

      {/* 4. AI Sales Insights & Forecaster */}
      {activeAiTab === "insights" && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-5 rounded-3xl space-y-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 w-fit">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-foreground">High Reorder Velocity</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Rosé Crystal Band Ring</strong> is trending +42% week-on-week. Recommended to
              reorder 50 units before Dhaka central stock exhausts in 4 days.
            </p>
          </div>

          <div className="bg-card border border-border p-5 rounded-3xl space-y-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 w-fit">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-foreground">Bundle Pricing Opportunity</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              64% of buyers who purchase <em>Blush Mini Crossbody</em> also view{" "}
              <em>Pearl Drop Studs</em>. Creating an "Eid Glamour Bundle" at ৳4,200 can boost AOV by
              ৳710.
            </p>
          </div>

          <div className="bg-card border border-border p-5 rounded-3xl space-y-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 w-fit">
              <Bot className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-foreground">
              Outside Dhaka Courier Optimization
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chattogram and Sylhet orders show 98.4% COD delivery success with Steadfast Courier.
              Consider offering <strong>Free Shipping over ৳2,500</strong> to scale outside Dhaka
              sales.
            </p>
          </div>
        </div>
      )}

      {/* 5. AI Image Studio & Background Enhancer */}
      {activeAiTab === "image" && (
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg">AI Product Image Background Studio</h3>
              <p className="text-muted-foreground">
                Simulate studio-grade background replacement for catalog photos
              </p>
            </div>
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            {[
              {
                id: "studio_white",
                label: "Studio Pure White",
                bg: "bg-white border-neutral-300 text-neutral-800",
              },
              {
                id: "luxury_marble",
                label: "Luxury Italian Marble",
                bg: "bg-neutral-100 border-neutral-300 text-neutral-800",
              },
              {
                id: "warm_sand",
                label: "Warm Sand Aesthetic",
                bg: "bg-amber-50 border-amber-200 text-amber-900",
              },
              {
                id: "rose_glow",
                label: "Signature Rose Glow",
                bg: "bg-rose-50 border-rose-200 text-rose-900",
              },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setBgStyle(st.id as any);
                  toast.success(`Applied ${st.label} style!`);
                }}
                className={`p-3 rounded-2xl border text-center font-bold transition ${
                  bgStyle === st.id ? "ring-2 ring-primary border-primary" : "opacity-80"
                } ${st.bg}`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="p-8 rounded-3xl bg-secondary/40 border border-border flex flex-col items-center justify-center text-center space-y-3 min-h-48">
            <ImageIcon className="w-10 h-10 text-primary/40" />
            <p className="font-bold text-sm">Cloudinary AI Background Engine Ready</p>
            <p className="text-muted-foreground max-w-sm">
              Upload any product photograph taken with a smartphone. The AI automatically removes
              shadows and places products on premium studio backdrops.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

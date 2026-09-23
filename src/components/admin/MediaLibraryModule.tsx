"use client";

import React, { useState } from "react";
import {
  Image as ImageIcon,
  UploadCloud,
  Copy,
  Trash2,
  ExternalLink,
  Search,
  Check,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

export function MediaLibraryModule() {
  const [mediaAssets, setMediaAssets] = useState([
    {
      id: "med_1",
      name: "hero-autumn-edit.jpg",
      folder: "koreanskincare/banners",
      dimensions: "1920x1080",
      size: "340 KB",
      url: "https://res.cloudinary.com/koreanskincare/image/upload/v1/banners/hero-autumn.jpg",
      uploadedAt: "12 Aug 2026",
    },
    {
      id: "med_2",
      name: "blush-mini-crossbody-front.jpg",
      folder: "koreanskincare/products",
      dimensions: "1200x1500",
      size: "210 KB",
      url: "https://res.cloudinary.com/koreanskincare/image/upload/v1/products/blush-bag-1.jpg",
      uploadedAt: "10 Aug 2026",
    },
    {
      id: "med_3",
      name: "rose-gold-stack-macro.jpg",
      folder: "koreanskincare/products",
      dimensions: "1200x1200",
      size: "180 KB",
      url: "https://res.cloudinary.com/koreanskincare/image/upload/v1/products/rose-ring-1.jpg",
      uploadedAt: "08 Aug 2026",
    },
    {
      id: "med_4",
      name: "eid-festive-banner-2026.jpg",
      folder: "koreanskincare/banners",
      dimensions: "2400x900",
      size: "520 KB",
      url: "https://res.cloudinary.com/koreanskincare/image/upload/v1/banners/eid-mega-sale.jpg",
      uploadedAt: "05 Aug 2026",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");

  const filteredAssets = mediaAssets.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = folderFilter === "all" || a.folder.includes(folderFilter);
    return matchesSearch && matchesFolder;
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Cloudinary CDN URL copied to clipboard!");
  };

  const handleSimulateUpload = () => {
    const newAsset = {
      id: `med_${Date.now()}`,
      name: `catalog-item-${Math.floor(100 + Math.random() * 900)}.jpg`,
      folder: "koreanskincare/products",
      dimensions: "1500x1500",
      size: "245 KB",
      url: `https://res.cloudinary.com/koreanskincare/image/upload/v1/products/new-asset-${Date.now()}.jpg`,
      uploadedAt: "Just now",
    };
    setMediaAssets([newAsset, ...mediaAssets]);
    toast.success("Image optimized and uploaded to Cloudinary CDN!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold">Cloudinary Media Library & CDN</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage high-res product photos, campaign banners & WebP auto-compressed assets
          </p>
        </div>

        <button
          onClick={handleSimulateUpload}
          className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Asset</span>
        </button>
      </div>

      {/* Media Assets Grid */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets by file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border bg-background text-xs focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-card border border-border rounded-2xl p-3 shadow-2xs space-y-2 hover:border-primary/50 transition group"
            >
              <div className="aspect-square bg-secondary/50 rounded-xl flex items-center justify-center relative overflow-hidden">
                <ImageIcon className="w-12 h-12 text-primary/30" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono bg-black/60 text-white font-bold">
                  {asset.dimensions}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-foreground truncate">{asset.name}</h4>
                <p className="text-[10px] text-muted-foreground">
                  {asset.folder} · {asset.size}
                </p>
              </div>

              <div className="flex gap-1.5 pt-1 border-t border-border">
                <button
                  onClick={() => handleCopyUrl(asset.url)}
                  className="flex-1 py-1.5 rounded-xl border border-border hover:bg-secondary text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy CDN</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { FileText, Plus, Edit2, Trash2, Globe, Code, Check, Copy, Search } from "lucide-react";
import { toast } from "sonner";

export function CmsBlogSeoModule() {
  const [activeSubTab, setActiveSubTab] = useState<"blog" | "pages" | "schema">("blog");

  const [posts, setPosts] = useState([
    {
      id: "post_1",
      title: "The Rose Gold Story: Why Pink Tones Resonate in Dhaka",
      slug: "the-rose-gold-story",
      author: "Nusrat Jahan",
      date: "14 Aug 2026",
      views: 1840,
      status: "published",
    },
    {
      id: "post_2",
      title: "How to Choose an Everyday Luxury Bag That Lasts",
      slug: "choosing-a-bag-that-lasts",
      author: "Store Editorial",
      date: "08 Aug 2026",
      views: 920,
      status: "published",
    },
  ]);

  const [cmsPages, setCmsPages] = useState([
    { title: "About koreanskincare.bd & Our Story", slug: "about", status: "published" },
    { title: "Delivery Policy & 64 District Hubs", slug: "delivery-policy", status: "published" },
    { title: "7-Day Return & Replacement Terms", slug: "return-policy", status: "published" },
    { title: "Privacy Policy & Customer Data", slug: "privacy", status: "published" },
  ]);

  const schemaJsonLd = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "koreanskincare.bd",
      url: "https://koreanskincare.bd",
      logo: "https://koreanskincare.bd/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+880 1711-223344",
        contactType: "Customer Support",
        areaServed: "BD",
        availableLanguage: ["en", "bn"],
      },
      sameAs: ["https://facebook.com/koreanskincarebd", "https://instagram.com/koreanskincarebd"],
    },
    null,
    2,
  );

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaJsonLd);
    toast.success("Schema.org JSON-LD snippet copied!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold">CMS, Blog & SEO Management</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Publish journal articles, manage legal pages & inject Schema.org structured data
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-secondary p-1 rounded-2xl border border-border text-xs">
          <button
            onClick={() => setActiveSubTab("blog")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === "blog" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
            }`}
          >
            Blog & Journal ({posts.length})
          </button>
          <button
            onClick={() => setActiveSubTab("pages")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === "pages" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
            }`}
          >
            Policy Pages ({cmsPages.length})
          </button>
          <button
            onClick={() => setActiveSubTab("schema")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === "schema" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
            }`}
          >
            Schema.org JSON-LD
          </button>
        </div>
      </div>

      {/* 1. Blog Posts Subview */}
      {activeSubTab === "blog" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Journal Articles</h3>
            <button
              onClick={() => toast.success("Opened article editor draft!")}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Article</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-foreground">{post.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Author: {post.author} · Date: {post.date} · Views: {post.views.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600">
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Policy Pages Subview */}
      {activeSubTab === "pages" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-serif font-bold text-lg">CMS Storefront Pages</h3>
          <div className="space-y-2.5">
            {cmsPages.map((page) => (
              <div
                key={page.slug}
                className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-foreground">{page.title}</h4>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    URL: https://koreanskincare.bd/{page.slug}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600">
                  {page.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Schema.org JSON-LD */}
      {activeSubTab === "schema" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg">Schema.org JSON-LD Structured Data</h3>
              <p className="text-muted-foreground">
                Automated SEO rich snippets for Google Bangladesh
              </p>
            </div>
            <button
              onClick={handleCopySchema}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Schema</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-neutral-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto border border-neutral-800">
            {schemaJsonLd}
          </pre>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { use } from "react";

const POSTS: Record<string, { title: string; body: string }> = {
  "the-rose-gold-story": {
    title: "The Rose Gold Story",
    body: "A note on the signature tone behind koreanskincare.bd's most-loved pieces and why it works across seasons.",
  },
  "accessories-for-everyday-dressing": {
    title: "Accessories for Everyday Dressing",
    body: "A short guide to picking pieces that quietly elevate daily outfits without feeling overdone.",
  },
  "choosing-a-bag-that-lasts": {
    title: "Choosing a Bag That Lasts",
    body: "What to look for in structure, hardware, and finish when selecting a bag for regular use.",
  },
};

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const post = POSTS[decodeURIComponent(slug)] ?? {
    title: "Journal entry",
    body: "This article will be published soon.",
  };

  return (
    <section className="container-x py-16 lg:py-24 max-w-3xl">
      <p className="text-xs tracking-[0.2em] uppercase text-primary">Journal</p>
      <h1 className="font-serif text-5xl mt-3">{post.title}</h1>
      <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{post.body}</p>
      <Link href="/blog" className="mt-8 inline-flex items-center gap-1 text-sm text-primary">
        Back to journal <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  );
}

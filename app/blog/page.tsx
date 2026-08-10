import Link from "next/link";
import { ChevronRight } from "lucide-react";

const posts = [
  {
    slug: "the-rose-gold-story",
    title: "The Rose Gold Story",
    excerpt: "How we built a soft, modern collection around one signature tone.",
  },
  {
    slug: "accessories-for-everyday-dressing",
    title: "Accessories for Everyday Dressing",
    excerpt: "Small details that make a simple outfit feel finished.",
  },
  {
    slug: "choosing-a-bag-that-lasts",
    title: "Choosing a Bag That Lasts",
    excerpt: "Materials, finishes, and structure that age gracefully.",
  },
];

export default function BlogIndexPage() {
  return (
    <section className="container-x py-16 lg:py-24">
      <p className="text-xs tracking-[0.2em] uppercase text-primary">Journal</p>
      <h1 className="font-serif text-5xl mt-3">Stories and styling notes</h1>
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article key={post.slug} className="bg-card border border-border rounded-3xl p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Editorial</p>
            <h2 className="font-serif text-2xl mt-3">{post.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{post.excerpt}</p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-5 inline-flex items-center gap-1 text-sm text-primary"
            >
              Read more <ChevronRight className="w-4 h-4" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

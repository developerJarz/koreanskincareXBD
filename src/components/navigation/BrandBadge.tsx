import { optimizedImageUrl } from "@/lib/image";

/**
 * A brand's logo on a white tile, or a round monogram of its initials when no logo has been
 * uploaded yet. `className` sizes the monogram, `logoClassName` the (wider) logo tile.
 */
export function BrandBadge({
  name,
  logo,
  className = "w-12 h-12",
  logoClassName = "w-full h-12",
}: {
  name: string;
  logo?: string;
  className?: string;
  logoClassName?: string;
}) {
  if (logo) {
    return (
      <span
        className={`${logoClassName} shrink-0 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden px-2 py-1.5`}
      >
        <img
          src={optimizedImageUrl(logo, 320)}
          alt={`${name} logo`}
          loading="lazy"
          className="max-w-full max-h-full object-contain"
        />
      </span>
    );
  }

  const initials = name
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={`${className} shrink-0 rounded-full bg-gradient-to-br from-blush to-accent text-accent-foreground border border-primary/15 flex items-center justify-center font-serif font-semibold text-sm tracking-wide`}
    >
      {initials || name.slice(0, 1)}
    </span>
  );
}

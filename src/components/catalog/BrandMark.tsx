import { getResponsiveImage } from "@/lib/image";

const SIZES = {
  sm: "w-16 h-16 text-sm",
  md: "w-24 h-24 text-base",
  lg: "w-28 h-28 text-lg",
};

// Logos are mostly wide wordmarks, so they get a wider tile than the name-only fallback
const LOGO_SIZES = {
  sm: "w-full max-w-28 h-14 px-2.5",
  md: "w-full max-w-40 h-20 px-3",
  lg: "w-44 h-28 px-4",
};

/** A brand's logo, or its name set as a wordmark when no logo has been uploaded yet. */
export function BrandMark({
  name,
  logo,
  size = "md",
}: {
  name: string;
  logo?: string;
  size?: keyof typeof SIZES;
}) {
  if (logo) {
    return (
      // Always white: brand logos are designed for a light background (also in dark mode)
      <span
        className={`${LOGO_SIZES[size]} shrink-0 rounded-2xl bg-white border border-border flex items-center justify-center overflow-hidden py-2`}
      >
        <img
          {...getResponsiveImage(logo, [160, 320])}
          sizes="176px"
          alt={`${name} logo`}
          width={176}
          height={70}
          loading="lazy"
          className="max-w-full max-h-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className={`${SIZES[size]} shrink-0 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden p-2`}
    >
      <span
        className="font-serif font-semibold text-center leading-tight text-foreground"
        aria-hidden="true"
      >
        {name}
      </span>
    </span>
  );
}

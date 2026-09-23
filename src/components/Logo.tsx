import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "header" | "footer" | "admin" | "icon-only";
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", variant = "header", size = "md" }: LogoProps) {
  const isFooter = variant === "footer";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* K-Beauty Droplet & Radiance Glow Icon */}
      <div
        className={`relative flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 shrink-0 ${
          isFooter
            ? "w-9 h-9 bg-primary/20 text-primary border border-primary/30"
            : variant === "admin"
              ? "w-8 h-8 bg-primary/10 text-primary border border-primary/20"
              : "w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 bg-gradient-to-br from-primary/15 via-rose-500/10 to-amber-500/15 text-primary border border-primary/25 shadow-xs"
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={size === "sm" ? "w-4.5 h-4.5" : "w-5 h-5 sm:w-5.5 sm:h-5.5"}
        >
          {/* Korean Glass Skin Dewdrop + Botanical Petal Motif */}
          <path
            d="M16 3C16 3 24 13.5 24 19.5C24 23.9183 20.4183 27.5 16 27.5C11.5817 27.5 8 23.9183 8 19.5C8 13.5 16 3 16 3Z"
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 9C16 9 20.5 16 20.5 19.5C20.5 22 18.5 24 16 24C13.5 24 11.5 22 11.5 19.5C11.5 16 16 9 16 9Z"
            fill="currentColor"
            fillOpacity="0.35"
          />
          {/* Sparkle Accent */}
          <circle cx="21" cy="9" r="1.5" fill="currentColor" />
          <circle cx="11" cy="12" r="1" fill="currentColor" fillOpacity="0.6" />
        </svg>
      </div>

      {variant !== "icon-only" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-0.5">
            <span
              className={`font-serif tracking-tight font-medium ${
                isFooter ? "text-white text-lg sm:text-xl" : "text-foreground text-lg sm:text-xl"
              }`}
            >
              Korean
            </span>
            <span
              className={`font-sans font-extrabold tracking-tight ${
                isFooter ? "text-primary text-lg sm:text-xl" : "text-primary text-lg sm:text-xl"
              }`}
            >
              Skincare
            </span>
            <span
              className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded-md ml-1 font-mono tracking-wide ${
                isFooter
                  ? "bg-primary/25 text-primary border border-primary/30"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              .bd
            </span>
          </div>
          <span
            className={`text-[8.5px] uppercase tracking-[0.22em] font-medium mt-0.5 ${
              isFooter ? "text-white/60" : "text-muted-foreground"
            }`}
          >
            Authentic Seoul Beauty
          </span>
        </div>
      )}
    </div>
  );
}

export function SiteLogoLink({
  className = "",
  variant = "header",
}: {
  className?: string;
  variant?: "header" | "footer" | "admin";
}) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center transition-transform active:scale-98 ${className}`}
      aria-label="KoreanSkincare.bd Homepage"
    >
      <Logo variant={variant} />
    </Link>
  );
}

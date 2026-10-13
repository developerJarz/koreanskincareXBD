"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { getResponsiveImage } from "@/lib/image";
import type { HeroSlide, SliderHeight } from "@/lib/storefront";

/** Banner height per setting: phones get a little less so the shop shows below the fold. */
const HEIGHT: Record<SliderHeight, string> = {
  compact: "h-[36vh] min-h-[220px] sm:h-[40vh] lg:h-[45vh] max-h-[520px]",
  standard: "h-[48vh] min-h-[260px] sm:h-[52vh] lg:h-[60vh] max-h-[680px]",
  tall: "h-[56vh] min-h-[300px] sm:h-[62vh] lg:h-[70vh] max-h-[780px]",
};

const WIDTHS = [640, 960, 1280, 1600, 2000];

/**
 * Homepage banner slider. Slides, timing and height are set in admin → Website design →
 * Homepage. Swipe on phones, arrows and dots on larger screens. Autoplay pauses while the
 * pointer or keyboard focus is on it, when the tab is hidden, and for visitors who ask for
 * reduced motion; it can also be paused with the button (WCAG 2.2.2).
 */
export function HeroCarousel({
  slides,
  autoplay,
  intervalSeconds,
  height,
}: {
  slides: HeroSlide[];
  autoplay: boolean;
  intervalSeconds: number;
  height: SliderHeight;
}) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: slides.length > 1, duration: 28 });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mq.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    onSelect();
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla]);

  const running = autoplay && slides.length > 1 && !paused && !hovered && !hidden && !reducedMotion;

  // Advance after the interval; restarting on every slide change keeps the progress bar in sync
  useEffect(() => {
    if (!embla || !running) return;
    const t = setTimeout(() => embla.scrollNext(), intervalSeconds * 1000);
    return () => clearTimeout(t);
  }, [embla, running, index, intervalSeconds]);

  const go = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="container-x pt-3 sm:pt-5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") embla?.scrollPrev();
        if (e.key === "ArrowRight") embla?.scrollNext();
      }}
    >
      <div
        className={`group/hero relative overflow-hidden rounded-2xl sm:rounded-3xl bg-secondary ${HEIGHT[height]}`}
      >
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full touch-pan-y">
            {slides.map((slide, i) => (
              <Slide key={i} slide={slide} index={i} count={slides.length} active={i === index} />
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => embla?.scrollPrev()}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow-md opacity-0 transition-opacity group-hover/hero:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => embla?.scrollNext()}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow-md opacity-0 transition-opacity group-hover/hero:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="absolute inset-x-0 bottom-3 sm:bottom-4 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur-sm">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Show slide ${i + 1} of ${slides.length}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`relative h-1.5 overflow-hidden rounded-full bg-white/45 transition-[width] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      i === index ? "w-7" : "w-1.5"
                    }`}
                  >
                    {i === index && (
                      <span
                        key={`${index}-${running}`}
                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                        style={
                          running
                            ? { animation: `hero-progress ${intervalSeconds}s linear forwards` }
                            : { width: "100%" }
                        }
                      />
                    )}
                  </button>
                ))}
              </div>
              {autoplay && !reducedMotion && (
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-white"
                >
                  {paused ? (
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Slide({
  slide,
  index,
  count,
  active,
}: {
  slide: HeroSlide;
  index: number;
  count: number;
  active: boolean;
}) {
  const desktop = getResponsiveImage(slide.image, WIDTHS);
  const mobile = slide.mobileImage ? getResponsiveImage(slide.mobileImage, [480, 720, 960]) : null;
  const first = index === 0;
  const light = slide.theme === "light";
  const hasText =
    slide.textPosition !== "none" && Boolean(slide.title || slide.subtitle || slide.ctaLabel);
  const centered = slide.textPosition === "center";

  const picture = (
    <picture>
      {mobile && <source media="(max-width: 639px)" srcSet={mobile.srcSet} sizes="100vw" />}
      <img
        {...desktop}
        sizes="(min-width: 1440px) 1400px, 100vw"
        alt={slide.alt}
        // The first slide is the largest thing on the page: fetch it before anything else
        loading={first ? "eager" : "lazy"}
        fetchPriority={first ? "high" : "auto"}
        decoding={first ? "sync" : "async"}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </picture>
  );

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}`}
      aria-hidden={!active || undefined}
      className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
    >
      {/* Without a button the whole banner is the link */}
      {slide.href && !(hasText && slide.ctaLabel) ? (
        <Link
          href={slide.href}
          tabIndex={active ? 0 : -1}
          aria-label={slide.title || slide.alt || "Open offer"}
          className="absolute inset-0"
        >
          {picture}
        </Link>
      ) : (
        picture
      )}

      {hasText && (
        <>
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 ${
              centered
                ? light
                  ? "bg-black/35"
                  : "bg-white/35"
                : light
                  ? "bg-gradient-to-r from-black/75 via-black/45 to-black/10"
                  : "bg-gradient-to-r from-white/90 via-white/60 to-white/10"
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-0 flex flex-col justify-center gap-3 px-6 pb-8 sm:px-12 lg:px-16 ${
              centered ? "items-center text-center" : "items-start text-left"
            } ${light ? "text-white" : "text-neutral-900"}`}
          >
            {slide.title && (
              <h2
                className={`font-serif font-normal leading-[1.05] text-balance text-[clamp(1.75rem,5.2vw,4rem)] ${
                  centered ? "max-w-[20ch]" : "max-w-[16ch]"
                } ${light ? "drop-shadow-[0_1px_12px_rgb(0_0_0/0.35)]" : ""}`}
              >
                {slide.title}
              </h2>
            )}
            {slide.subtitle && (
              <p
                className={`max-w-[42ch] text-sm leading-relaxed sm:text-base ${light ? "text-white/90" : "text-neutral-700"}`}
              >
                {slide.subtitle}
              </p>
            )}
            {slide.ctaLabel && slide.href && (
              <Link
                href={slide.href}
                tabIndex={active ? 0 : -1}
                className={`pointer-events-auto mt-2 inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  light
                    ? "bg-white text-neutral-900 focus-visible:outline-white"
                    : "bg-primary text-primary-foreground focus-visible:outline-primary"
                }`}
              >
                {slide.ctaLabel}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

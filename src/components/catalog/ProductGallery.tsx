"use client";

import { useState } from "react";

import { getResponsiveImage } from "@/lib/image";

const LARGE = [480, 800, 1200];

export function ProductGallery({
  media,
  name,
}: {
  media: Array<{ url: string; alt: string }>;
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = media[active] ?? media[0];

  if (!current) {
    return (
      <div
        className="aspect-square rounded-3xl bg-secondary"
        aria-label={`${name} (no photo yet)`}
      />
    );
  }

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      {media.length > 1 && (
        <ul
          className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible"
          aria-label="Product photos"
        >
          {media.map((m, i) => (
            <li key={m.url + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1} of ${media.length}`}
                aria-current={i === active ? "true" : undefined}
                className={`block w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 bg-secondary ${
                  i === active ? "border-primary" : "border-transparent hover:border-border"
                }`}
              >
                <img
                  {...getResponsiveImage(m.url, [160, 240])}
                  sizes="80px"
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex-1 aspect-square rounded-3xl overflow-hidden bg-secondary border border-border">
        <img
          key={current.url}
          {...getResponsiveImage(current.url, LARGE)}
          sizes="(min-width: 1024px) 45vw, 100vw"
          alt={current.alt || name}
          width={1200}
          height={1200}
          fetchPriority={active === 0 ? "high" : "auto"}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

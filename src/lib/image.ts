export type ImageSource = string | { src: string };

export function getImageSrc(image: ImageSource) {
  return typeof image === "string" ? image : image.src;
}

const RESPONSIVE_WIDTHS = [320, 480, 640, 800];

const isCloudinaryUrl = (src: string) =>
  src.includes("res.cloudinary.com/") && src.includes("/upload/");

const cloudinaryResized = (src: string, width: number) =>
  src.replace("/upload/", `/upload/w_${width},c_limit,f_auto,q_auto/`);

/**
 * One resized, modern-format copy of a Cloudinary image — for small thumbnails (cart, admin
 * lists, logos). Pass about twice the displayed width so it stays sharp on high-DPI screens.
 * Other URLs are returned unchanged.
 */
export function optimizedImageUrl(src: string | undefined, width: number): string {
  if (!src) return "";
  return isCloudinaryUrl(src) ? cloudinaryResized(src, width) : src;
}

/**
 * Builds a srcSet for image CDNs that resize on the fly (Unsplash, Cloudinary) so phones
 * download a small, modern-format file instead of the full 800px JPEG.
 * Other URLs are returned unchanged with no srcSet.
 */
export function getResponsiveImage(
  src: string,
  widths: number[] = RESPONSIVE_WIDTHS,
): { src: string; srcSet?: string } {
  const fallbackWidth = widths[Math.floor((widths.length - 1) / 2)];
  try {
    if (src.startsWith("https://images.unsplash.com/")) {
      const build = (w: number) => {
        const url = new URL(src);
        url.searchParams.set("w", String(w));
        url.searchParams.set("q", "70");
        url.searchParams.set("auto", "format");
        url.searchParams.set("fit", "crop");
        return url.toString();
      };
      return {
        src: build(fallbackWidth),
        srcSet: widths.map((w) => `${build(w)} ${w}w`).join(", "),
      };
    }

    if (isCloudinaryUrl(src)) {
      const build = (w: number) => cloudinaryResized(src, w);
      return {
        src: build(fallbackWidth),
        srcSet: widths.map((w) => `${build(w)} ${w}w`).join(", "),
      };
    }
  } catch {
    // Malformed URL — fall through and use it as-is
  }
  return { src };
}

export type ImageSource = string | { src: string };

export function getImageSrc(image: ImageSource) {
  return typeof image === "string" ? image : image.src;
}

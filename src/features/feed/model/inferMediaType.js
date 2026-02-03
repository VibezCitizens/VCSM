export function inferMediaType(url) {
  if (!url) return "text";
  if (/\.(mp4|webm|mov)$/i.test(url)) return "video";
  if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url)) return "image";
  return "image";
}

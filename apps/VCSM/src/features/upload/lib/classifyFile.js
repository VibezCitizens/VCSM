const ACCEPTED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export function classifyFile(file) {
  if (!file) return { type: null, error: "No file" };

  if (file.size > MAX_BYTES) {
    return { type: null, error: "File too large (max 50MB)" };
  }

  if (ACCEPTED_IMAGE.includes(file.type)) return { type: "image", error: null };
  if (ACCEPTED_VIDEO.includes(file.type)) return { type: "video", error: null };

  return { type: null, error: "Unsupported file type" };
}

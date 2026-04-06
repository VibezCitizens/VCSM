// src/features/wanders/utils/buildWandersImageKey.js
export function buildWandersImageKey({ publicId, file }) {
  const ext = getExtension(file?.name, file?.type);
  const safePublicId = String(publicId || "temp").replace(/[^a-zA-Z0-9_-]/g, "");
  return `wanders/cards/${safePublicId}/image.${ext}`;
}

function getExtension(name, mime) {
  if (name && name.includes(".")) return name.split(".").pop().toLowerCase();
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  return "jpg";
}

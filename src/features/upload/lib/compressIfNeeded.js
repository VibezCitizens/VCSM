import { compressImageFile } from "@/shared/lib/compressImage";

export async function compressIfNeeded(file) {
  if (!file) return file;

  if (!file.type.startsWith("image/")) return file;

  try {
    return await compressImageFile(file, 1080, 0.8);
  } catch (err) {
    console.warn("Compression failed, using original:", err);
    return file;
  }
}

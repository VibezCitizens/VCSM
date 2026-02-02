import { uploadToCloudflare } from "@/services/cloudflare/uploadToCloudflare";
import { compressIfNeeded } from "../lib/compressIfNeeded";
import { buildR2Key } from "@/services/cloudflare/buildR2Key";

const MAX_VIBES_PHOTOS = 10;

function prefixForMode(mode) {
  if (mode === "post") return "vibes";
  if (mode === "24drop") return "stories";
  if (mode === "vdrop") return "vdrops";
  return "vibes";
}

function inferMediaType(file) {
  const t = String(file?.type || "");
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  return "file";
}

/**
 * Uploads 1..N files and returns { mediaUrls, mediaTypes } preserving order.
 * - VIBES (mode === 'post'): up to 10 images
 * - stories/vdrops: keep it single-file behavior (uses first file)
 */
export async function uploadMedia(files, actorId, mode = "post") {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!list.length) return { mediaUrls: [], mediaTypes: [] };

  const prefix = prefixForMode(mode);

  // non-vibes: keep single
  if (mode !== "post") {
    const prepared = await compressIfNeeded(list[0]);
    const key = buildR2Key(prefix, actorId, prepared);
    const { url, error } = await uploadToCloudflare(prepared, key);
    if (error) throw new Error(error);
    return { mediaUrls: [url], mediaTypes: [inferMediaType(prepared)] };
  }

  // vibes: up to 10 images
  const images = list.filter((f) => String(f?.type || "").startsWith("image/"));
  if (!images.length) return { mediaUrls: [], mediaTypes: [] };

  if (images.length > MAX_VIBES_PHOTOS) {
    throw new Error(`VIBES: max ${MAX_VIBES_PHOTOS} photos per upload.`);
  }

  // group this batch under a shared folder for easy browsing
  const batchId = Math.floor(Date.now() / 1000).toString(10);

  // prepare + upload in order
  const preparedList = [];
  for (const f of images) {
    preparedList.push(await compressIfNeeded(f));
  }

  const uploads = preparedList.map(async (prepared) => {
    const key = buildR2Key(prefix, actorId, prepared, { extraPath: `batch-${batchId}` });
    const { url, error } = await uploadToCloudflare(prepared, key);
    if (error || !url) throw new Error(error || "Upload failed");
    return { url, type: inferMediaType(prepared) };
  });

  const results = await Promise.all(uploads);

  return {
    mediaUrls: results.map((r) => r.url),
    mediaTypes: results.map((r) => r.type),
  };
}

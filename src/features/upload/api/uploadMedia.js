import { uploadToCloudflare } from "@/services/cloudflare/uploadToCloudflare";
import { compressIfNeeded } from "../lib/compressIfNeeded";

export async function uploadMedia(file, actorId) {
  let prepared = await compressIfNeeded(file);

  const timestamp = Date.now();
  const safe = prepared.name.replace(/[^a-z0-9.\-_]/gi, "_");

  const key = `posts/${actorId}/${timestamp}-${safe}`;

  const { url, error } = await uploadToCloudflare(prepared, key);
  if (error) throw new Error(error);

  return url;
}

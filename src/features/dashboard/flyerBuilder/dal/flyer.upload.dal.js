import { buildR2Key } from "@/services/cloudflare/buildR2Key";
import { uploadToCloudflare } from "@/services/cloudflare/uploadToCloudflare";

/**
 * Keeps your existing call-site intact:
 * uploadFlyerImage({ bucket, vportId, file, kind })
 *
 * NOTE: `bucket` is ignored now (Cloudflare R2 handles storage).
 */
export async function uploadFlyerImage({ vportId, file, kind }) {
  if (!vportId) throw new Error("Missing vportId");
  if (!file) throw new Error("Missing file");
  if (!kind) throw new Error("Missing kind");

  // Put flyer assets in a predictable folder:
  // flyers/<vportId>/assets/YYYY/MM/DD/<ts>-<rand>.<ext>
  const key = buildR2Key("flyers", vportId, file, { extraPath: "assets" });

  const { url, error } = await uploadToCloudflare(file, key);
  if (error) throw new Error(error);

  return url || "";
}

export default uploadFlyerImage;

// features/vport/controller/submitCreateVport.controller.js
// ============================================================
// Orchestrates vport creation: upload → create → workspace setup → list refresh.
// No React. No UI. Pure async.
// ============================================================

import { createVport } from "@/features/vport/dal/vport.core.dal";
import { listMyVports } from "@/features/vport/dal/vport.read.vportRecords.dal";
import { VPORT_TYPE_GROUPS as TYPE_GROUPS } from "@/features/profiles/adapters/kinds/vport/config/vportTypes.config.adapter";
import { uploadMediaController } from "@media";
import { createMediaAssetController } from "@/features/media/controller/createMediaAsset.controller";
import { resolveVcsmAppIdDAL } from '@/features/media/dal/resolveAppId.read.dal'
import { updateVportAvatarMediaAssetIdDAL } from "@/features/vport/dal/vport.write.profileMedia.dal";
import { createOrganizationLocationWorkspace } from "@booking";
import { bugBunnyUploadStep, bugBunnyUploadError } from "@debuggers/media/bugBunnyUploadDebugger";

export async function submitCreateVportController({
  name,
  type,
  description,
  avatarFile,
  avatarUrl,
  directoryVisible,
  userId,
  withList = false,
}) {
  let finalAvatarUrl = avatarUrl || "";
  let vportUploadResult = null;

  if (!finalAvatarUrl && avatarFile) {
    vportUploadResult = await uploadMediaController({
      file: avatarFile,
      scope: "vport_creation_avatar",
      ownerActorId: userId,
    });
    finalAvatarUrl = vportUploadResult.publicUrl || "";
  }

  const normalizedType = String(type).toLowerCase();
  const allTypes = Object.values(TYPE_GROUPS).flat();
  if (!allTypes.includes(normalizedType)) {
    throw new Error("Invalid Vport type.");
  }

  const res = await createVport({
    name: name.trim(),
    slug: null,
    avatarUrl: finalAvatarUrl || null,
    bio: (description || "").trim() || null,
    vportType: normalizedType,
    directoryVisible,
  });

  if (normalizedType === "barbershop" && res?.actorId && res?.profileId) {
    const orgSlug =
      name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) +
      "-" +
      res.actorId.slice(0, 8);
    try {
      await createOrganizationLocationWorkspace({
        requestActorId: res.actorId,
        profileId: res.profileId,
        organizationName: name.trim(),
        organizationSlug: orgSlug,
        organizationType: "business",
        locationName: name.trim(),
        locationSlug: "main",
        resourceName: name.trim(),
        resourceType: "staff",
      });
    } catch {
      // non-fatal — workspace can be configured from dashboard
    }
  }

  if (vportUploadResult && res?.actorId) {
    ;(async () => {
      bugBunnyUploadStep('vport_creation_avatar', 'writeback:start', { actorId: res.actorId, profileId: res.profileId })
      try {
        const appId = await resolveVcsmAppIdDAL()
        const mediaAsset = await createMediaAssetController({
          mediaUploadResult:  vportUploadResult,
          ownerActorId:       res.actorId,
          createdByActorId:   res.actorId,
          scope:              'vport_creation_avatar',
          scopeId:            res.actorId,
          mediaRole:          'avatar',
          appId,
        })
        if (mediaAsset?.id && res?.actorId) {
          await updateVportAvatarMediaAssetIdDAL({ actorId: res.actorId, mediaAssetId: mediaAsset.id })
          bugBunnyUploadStep('vport_creation_avatar', 'writeback:profile', { profileId: res.profileId, mediaAssetId: mediaAsset.id })
        } else {
          bugBunnyUploadStep('vport_creation_avatar', 'writeback:profile-skipped', { hasAssetId: !!mediaAsset?.id, hasProfileId: !!res?.profileId })
        }
      } catch (e) {
        bugBunnyUploadError('vport_creation_avatar', 'writeback:failed', e, { actorId: res.actorId })
        if (import.meta.env?.DEV) console.warn('[submitCreateVportController] media_assets write-back failed (non-fatal):', e?.message)
      }
    })()
  }

  const list = withList ? await listMyVports().catch(() => null) : null;

  return { res, finalAvatarUrl, list };
}

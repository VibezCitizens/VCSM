import { useCallback, useState } from "react";
import { createItem, updateItem } from "@portfolio";
import { addPortfolioMediaWithRecord } from "@/features/dashboard/vport/controller/addPortfolioMediaWithRecord.controller";
import { ctrlSavePortfolioDetail } from "@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller";
import { publishLocksmithPortfolioUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller";

const TITLE_MAX = 22;

export function usePortfolioItemSubmit({
  isEdit,
  editItemId,
  existingItem,
  actorId,
  files,
  title,
  description,
  kind,
  tagsInput,
  previews,
  onDone,
  isLocksmith,
  onOptimisticUpdate,
  jobType,
  propertyType,
  lockType,
  hardwareBrand,
  serviceMode,
  isEmergencyJob,
  isSecurityUpgrade,
  estimatedDuration,
  existingMediaCount,
  upload,
  shareToFeed = false,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async () => {
    if (!isEdit && !files.length) { setError(new Error("Add at least one photo.")); return; }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > TITLE_MAX) { setError(new Error(`Title must be ${TITLE_MAX} characters or less.`)); return; }

    setSaving(true);
    setError(null);

    const tags = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0 && t.length <= 48);

    let rollback = null;
    if (isEdit && onOptimisticUpdate) {
      rollback = onOptimisticUpdate(editItemId, {
        ...(existingItem ?? {}),
        title: trimmedTitle || null,
        description: description.trim() || null,
        portfolioKind: kind,
        tags,
      });
    }

    try {
      let itemId;
      let resultItem;

      if (isEdit) {
        resultItem = await updateItem({
          itemId: editItemId,
          actorId,
          updates: { title: trimmedTitle || null, description: description.trim() || null, portfolioKind: kind },
          tags,
        });
        itemId = editItemId;
      } else {
        resultItem = await createItem({
          actorId,
          title: trimmedTitle || undefined,
          description: description.trim() || undefined,
          portfolioKind: kind,
          tags: tags.length ? tags : undefined,
        });
        itemId = resultItem.id;
      }

      let firstMediaUrl = null;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadResult = await upload(file);
        const url = uploadResult.publicUrl;
        if (i === 0 && !isEdit) firstMediaUrl = url ?? null;
        const isFirstOfItem = !isEdit && i === 0;
        const mediaRole =
          kind === "before_after" && i === 0 ? "before"
          : kind === "before_after" && i === 1 ? "after"
          : isFirstOfItem ? "cover"
          : "result";

        await addPortfolioMediaWithRecord({
          itemId, actorId, url, mediaType: "image", mediaRole,
          sortOrder: (isEdit ? existingMediaCount : 0) + i,
          mediaUploadResult: uploadResult,
        });
      }

      if (isLocksmith) {
        await ctrlSavePortfolioDetail(itemId, {
          jobType: jobType || "other",
          propertyType: propertyType || null,
          lockType: lockType.trim() || null,
          hardwareBrand: hardwareBrand.trim() || null,
          serviceMode: serviceMode || null,
          hasBeforeAfter: kind === "before_after",
          isEmergencyJob,
          isSecurityUpgrade,
          estimatedDurationMinutes: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
        });

        if (shareToFeed && !isEdit) {
          try {
            await publishLocksmithPortfolioUpdateAsPostController({
              actorId,
              portfolioTitle: trimmedTitle || null,
              jobType: jobType || null,
              mediaUrl: firstMediaUrl,
            });
          } catch (_) {}
        }
      }

      previews.forEach(URL.revokeObjectURL);
      onDone?.(resultItem, { firstMediaUrl });
    } catch (e) {
      rollback?.();
      setError(e);
    } finally {
      setSaving(false);
    }
  }, [
    isEdit, editItemId, existingItem, actorId, files, title, description, kind,
    tagsInput, previews, onDone, isLocksmith, onOptimisticUpdate,
    jobType, propertyType, lockType, hardwareBrand, serviceMode,
    isEmergencyJob, isSecurityUpgrade, estimatedDuration, existingMediaCount,
    upload,
  ]);

  return { saving, error, handleSubmit };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMenuItemPhotoUpload } from "@/features/profiles/kinds/vport/screens/menu/hooks/useMenuItemPhotoUpload";

export function useMenuItemForm({
  open,
  mode,
  item,
  categories,
  actorId,
  saving,
  titleOverride,
  onSave,
  onClose,
}) {
  const effectiveMode = useMemo(() => {
    if (mode) return mode;
    return item?.id ? "edit" : "create";
  }, [mode, item]);

  const safeCategories = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories]
  );

  const [categoryIdValue, setCategoryIdValue] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [sortOrderValue, setSortOrderValue] = useState(0);
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [imageUrlValue, setImageUrlValue] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  const { upload: uploadMenuItemPhoto, uploading: uploadingImage } = useMenuItemPhotoUpload({ actorId });

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCategoryIdValue(item?.categoryId ?? safeCategories?.[0]?.id ?? "");
    setKeyValue(item?.key ?? "");
    setNameValue(item?.name ?? "");
    setDescriptionValue(item?.description ?? "");

    const cents =
      typeof item?.priceCents === "number"
        ? item.priceCents
        : typeof item?.price_cents === "number"
        ? item.price_cents
        : null;
    const dollars =
      cents != null
        ? cents / 100
        : typeof item?.price === "number"
        ? item.price
        : typeof item?.price_amount === "number"
        ? item.price_amount
        : null;

    setPriceValue(dollars != null && Number.isFinite(dollars) ? String(dollars) : "");
    setSortOrderValue(typeof item?.sortOrder === "number" ? item.sortOrder : 0);
    setIsActiveValue(item?.isActive ?? true);

    const existingImageUrl =
      typeof item?.imageUrl === "string"
        ? item.imageUrl
        : typeof item?.image_url === "string"
        ? item.image_url
        : "";

    setImageUrlValue(existingImageUrl || "");
    setImageFile(null);
    setImagePreviewUrl(existingImageUrl || null);
  }, [open, item, safeCategories]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        try { URL.revokeObjectURL(imagePreviewUrl); } catch { /* ignore */ }
      }
    };
  }, [imagePreviewUrl]);

  const modalTitle = useMemo(() => {
    if (titleOverride) return titleOverride;
    return effectiveMode === "edit" ? "Edit item" : "New item";
  }, [titleOverride, effectiveMode]);

  const canSubmit = useMemo(
    () => !!(nameValue ?? "").trim() && !!(categoryIdValue ?? "").trim() && !saving && !uploadingImage,
    [nameValue, categoryIdValue, saving, uploadingImage]
  );

  const handleClose = useCallback(() => {
    if (saving || uploadingImage) return;
    if (onClose) onClose();
  }, [saving, uploadingImage, onClose]);

  const handlePickImage = useCallback((e) => {
    const file = e?.target?.files?.[0] ?? null;
    if (!file) return;
    setImageFile(file);
    const blobUrl = URL.createObjectURL(file);
    setImagePreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        try { URL.revokeObjectURL(prev); } catch { /* ignore */ }
      }
      return blobUrl;
    });
  }, []);

  const handleClearImage = useCallback(() => {
    setImageFile(null);
    setImageUrlValue("");
    setImagePreviewUrl(null);
  }, []);

  const uploadImageIfNeeded = useCallback(async () => {
    if (!imageFile) return { url: imageUrlValue || null, mediaUploadResult: null };
    if (!actorId) throw new Error("actorId is required to upload item photos");
    const result = await uploadMenuItemPhoto(imageFile, {
      extraPath: categoryIdValue ? `category-${categoryIdValue}` : "",
    });
    const finalUrl = result.publicUrl || null;
    setImageUrlValue(finalUrl || "");
    return { url: finalUrl, mediaUploadResult: result };
  }, [imageFile, imageUrlValue, actorId, categoryIdValue, uploadMenuItemPhoto]);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (!onSave) return;
      setError(null);

      const rawPrice = (priceValue ?? "").trim();
      const priceNum =
        rawPrice === ""
          ? null
          : Number.isFinite(Number(rawPrice))
          ? Number(rawPrice)
          : NaN;

      if (Number.isNaN(priceNum)) { setError(new Error("Price must be a number")); return; }

      const priceCents = priceNum == null ? null : Math.round(Number(priceNum) * 100);

      let finalImageUrl = null;
      let mediaUploadResult = null;
      try {
        const uploadResult = await uploadImageIfNeeded();
        finalImageUrl = uploadResult.url;
        mediaUploadResult = uploadResult.mediaUploadResult;
      } catch (err) { setError(err); return; }

      const payload = {
        itemId: item?.id ?? null,
        categoryId: (categoryIdValue ?? "").trim(),
        key: (keyValue ?? "").trim() || null,
        name: (nameValue ?? "").trim(),
        description: (descriptionValue ?? "").trim() || null,
        price: priceNum == null ? null : Number(priceNum),
        priceCents: priceCents == null ? null : Number(priceCents),
        imageUrl: finalImageUrl,
        mediaUploadResult,
        sortOrder: Number.isFinite(Number(sortOrderValue)) ? Number(sortOrderValue) : 0,
        isActive: !!isActiveValue,
      };

      if (!payload.categoryId) { setError(new Error("Category is required")); return; }
      if (!payload.name) { setError(new Error("Name is required")); return; }

      try {
        await onSave(payload);
        handleClose();
      } catch (err) {
        setError(err);
      }
    },
    [onSave, item, categoryIdValue, keyValue, nameValue, descriptionValue, priceValue, sortOrderValue, isActiveValue, uploadImageIfNeeded, handleClose]
  );

  return {
    effectiveMode,
    safeCategories,
    modalTitle,
    canSubmit,
    uploadingImage,
    error,
    categoryIdValue,
    keyValue,
    nameValue,
    descriptionValue,
    priceValue,
    sortOrderValue,
    isActiveValue,
    imageUrlValue,
    imagePreviewUrl,
    handleClose,
    handlePickImage,
    handleClearImage,
    handleSubmit,
    setCategoryIdValue,
    setKeyValue,
    setNameValue,
    setPriceValue,
    setDescriptionValue,
    setSortOrderValue,
    setIsActiveValue,
  };
}

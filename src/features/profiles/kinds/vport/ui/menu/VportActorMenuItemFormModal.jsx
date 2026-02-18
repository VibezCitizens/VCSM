// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItemFormModal.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";

// ✅ Cloudflare upload helpers
import uploadToCloudflare from "@/services/cloudflare/uploadToCloudflare";
import { buildR2Key } from "@/services/cloudflare/buildR2Key";

import {
  overlayStyle,
  cardStyle,
  sectionPad,
  dangerBox,
} from "./VportActorMenuItemForm.styles";

import VportActorMenuItemFormHeader from "./VportActorMenuItemFormHeader";
import VportActorMenuItemFormFields from "./VportActorMenuItemFormFields";
import VportActorMenuItemFormActions from "./VportActorMenuItemFormActions";

/**
 * UI Modal: Create / Edit a Vport Actor Menu Item
 *
 * Contract:
 * - Pure UI + form state
 * - No DAL / no Supabase
 * - Calls `onSave(payload)` and `onClose()`
 *
 * Props:
 * - open: boolean
 * - mode: "create" | "edit" (optional; inferred from item?.id)
 * - item: item object (optional)
 * - categories: Array<{ id, name }>
 * - onSave: async function(payload) -> Promise<any>
 * - onClose: function()
 * - saving: boolean
 * - titleOverride: string (optional)
 * - actorId: string (✅ required for R2 key ownerId)
 */
export function VportActorMenuItemFormModal({
  open = false,
  mode = null,
  item = null,
  categories = [],
  onSave,
  onClose,

  saving = false,
  titleOverride = null,

  // ✅ required for uploads
  actorId = null,

  // optional UI
  disableKey = false,
  lockCategory = false,
  className = "",
} = {}) {
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

  // ✅ image state
  const [imageUrlValue, setImageUrlValue] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;

    setError(null);

    setCategoryIdValue(item?.categoryId ?? safeCategories?.[0]?.id ?? "");
    setKeyValue(item?.key ?? "");
    setNameValue(item?.name ?? "");
    setDescriptionValue(item?.description ?? "");

    // normalize price
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

    setPriceValue(
      dollars != null && Number.isFinite(dollars) ? String(dollars) : ""
    );

    setSortOrderValue(typeof item?.sortOrder === "number" ? item.sortOrder : 0);
    setIsActiveValue(item?.isActive ?? true);

    // imageUrl normalize
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

  // cleanup blob preview URL
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreviewUrl);
        } catch (_) {}
      }
    };
  }, [imagePreviewUrl]);

  const modalTitle = useMemo(() => {
    if (titleOverride) return titleOverride;
    return effectiveMode === "edit" ? "Edit item" : "New item";
  }, [titleOverride, effectiveMode]);

  const canSubmit = useMemo(() => {
    return (
      !!(nameValue ?? "").trim() &&
      !!(categoryIdValue ?? "").trim() &&
      !saving &&
      !uploadingImage
    );
  }, [nameValue, categoryIdValue, saving, uploadingImage]);

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
        try {
          URL.revokeObjectURL(prev);
        } catch (_) {}
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
    if (!imageFile) return imageUrlValue || null;

    if (!actorId) {
      throw new Error("actorId is required to upload item photos");
    }

    setUploadingImage(true);
    try {
      const key = buildR2Key("menu-items", actorId, imageFile, {
        extraPath: categoryIdValue ? `category-${categoryIdValue}` : "",
      });

      const { url, error: uploadError } = await uploadToCloudflare(imageFile, key);
      if (uploadError) throw new Error(uploadError || "Image upload failed");

      const finalUrl = url || null;
      setImageUrlValue(finalUrl || "");
      return finalUrl;
    } finally {
      setUploadingImage(false);
    }
  }, [imageFile, imageUrlValue, actorId, categoryIdValue]);

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

      if (Number.isNaN(priceNum)) {
        setError(new Error("Price must be a number"));
        return;
      }

      const priceCents =
        priceNum == null ? null : Math.round(Number(priceNum) * 100);

      let finalImageUrl = null;
      try {
        finalImageUrl = await uploadImageIfNeeded();
      } catch (err) {
        setError(err);
        return;
      }

      const payload = {
        itemId: item?.id ?? null,
        categoryId: (categoryIdValue ?? "").trim(),
        key: (keyValue ?? "").trim() || null,
        name: (nameValue ?? "").trim(),
        description: (descriptionValue ?? "").trim() || null,

        price: priceNum == null ? null : Number(priceNum),
        priceCents: priceCents == null ? null : Number(priceCents),

        imageUrl: finalImageUrl,

        sortOrder: Number.isFinite(Number(sortOrderValue))
          ? Number(sortOrderValue)
          : 0,
        isActive: !!isActiveValue,
      };

      if (!payload.categoryId) {
        setError(new Error("Category is required"));
        return;
      }

      if (!payload.name) {
        setError(new Error("Name is required"));
        return;
      }

      try {
        await onSave(payload);
        handleClose();
      } catch (err) {
        setError(err);
      }
    },
    [
      onSave,
      item,
      categoryIdValue,
      keyValue,
      nameValue,
      descriptionValue,
      priceValue,
      sortOrderValue,
      isActiveValue,
      uploadImageIfNeeded,
      handleClose,
    ]
  );

  if (!open) return null;

  const disabled = saving || uploadingImage;

  return (
    <div
      className={className}
      role="dialog"
      aria-modal="true"
      style={overlayStyle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div style={cardStyle}>
        <VportActorMenuItemFormHeader
          title={modalTitle}
          onClose={handleClose}
          disabled={disabled}
        />

        <form onSubmit={handleSubmit} style={sectionPad}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <VportActorMenuItemFormFields
              safeCategories={safeCategories}
              lockCategory={lockCategory}
              disableKey={disableKey}
              uploadingImage={uploadingImage}
              disabled={disabled}
              categoryIdValue={categoryIdValue}
              keyValue={keyValue}
              nameValue={nameValue}
              priceValue={priceValue}
              descriptionValue={descriptionValue}
              sortOrderValue={sortOrderValue}
              isActiveValue={isActiveValue}
              imagePreviewUrl={imagePreviewUrl}
              imageUrlValue={imageUrlValue}
              onChangeCategoryId={(e) => setCategoryIdValue(e.target.value)}
              onChangeKey={(e) => setKeyValue(e.target.value)}
              onChangeName={(e) => setNameValue(e.target.value)}
              onChangePrice={(e) => setPriceValue(e.target.value)}
              onChangeDescription={(e) => setDescriptionValue(e.target.value)}
              onChangeSortOrder={(e) => setSortOrderValue(e.target.value)}
              onChangeIsActive={(e) => setIsActiveValue(e.target.checked)}
              onPickImage={handlePickImage}
              onClearImage={handleClearImage}
            />

            {error ? (
              <div style={dangerBox}>
                {error?.message ?? "Something went wrong"}
              </div>
            ) : null}

            <VportActorMenuItemFormActions
              canSubmit={canSubmit}
              saving={saving}
              uploadingImage={uploadingImage}
              effectiveMode={effectiveMode}
              onCancel={handleClose}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default VportActorMenuItemFormModal;

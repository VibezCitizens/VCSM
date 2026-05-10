import { useCallback, useEffect, useMemo, useState } from "react";
import {
  overlayStyle,
  cardStyle,
  headerStyle,
  titleStyle,
  getButtonBase,
} from "@/features/profiles/kinds/vport/screens/menu/components/vportActorMenuCategoryForm.styles";
import { VportActorMenuCategoryFormBody } from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryFormBody";

export function VportActorMenuCategoryFormModal({
  open = false,
  mode = null,
  category = null,
  onSave,
  onClose,
  saving = false,
  titleOverride = null,
  disableKey = false,
  className = "",
  onShareToFeed = null,
} = {}) {
  const effectiveMode = useMemo(() => {
    if (mode) return mode;
    return category?.id ? "edit" : "create";
  }, [mode, category]);

  const [keyValue, setKeyValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [sortOrderValue, setSortOrderValue] = useState(0);
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [error, setError] = useState(null);
  const [shareToFeed, setShareToFeed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setShareToFeed(false);
    setKeyValue(category?.key ?? "");
    setNameValue(category?.name ?? "");
    setDescriptionValue(category?.description ?? "");
    setSortOrderValue(typeof category?.sortOrder === "number" ? category.sortOrder : 0);
    setIsActiveValue(category?.isActive ?? true);
  }, [open, category]);

  const canSubmit = useMemo(() => !!(nameValue ?? "").trim() && !saving, [nameValue, saving]);

  const modalTitle = useMemo(() => {
    if (titleOverride) return titleOverride;
    return effectiveMode === "edit" ? "Edit category" : "New category";
  }, [titleOverride, effectiveMode]);

  const handleClose = useCallback(() => {
    if (saving) return;
    if (onClose) onClose();
  }, [saving, onClose]);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (!onSave) return;
      setError(null);
      const payload = {
        categoryId: category?.id ?? null,
        key: (keyValue ?? "").trim() || null,
        name: (nameValue ?? "").trim(),
        description: (descriptionValue ?? "").trim() || null,
        sortOrder: Number.isFinite(Number(sortOrderValue)) ? Number(sortOrderValue) : 0,
        isActive: !!isActiveValue,
      };
      if (!payload.name) { setError(new Error("Name is required")); return; }
      try {
        await onSave(payload);
        if (shareToFeed && onShareToFeed) {
          const action = payload.categoryId ? "updated" : "added";
          try {
            await onShareToFeed({ action, subject: "category", subjectName: payload.name });
          } catch {
            // Non-blocking — category save already committed
          }
        }
        handleClose();
      } catch (err) {
        setError(err);
      }
    },
    [onSave, category, keyValue, nameValue, descriptionValue, sortOrderValue, isActiveValue, handleClose, shareToFeed, onShareToFeed]
  );

  if (!open) return null;

  return (
    <div
      className={className}
      role="dialog"
      aria-modal="true"
      style={overlayStyle}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={titleStyle}>{modalTitle}</div>
          <button type="button" onClick={handleClose} disabled={saving} style={getButtonBase(saving)}>
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 16, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <VportActorMenuCategoryFormBody
            keyValue={keyValue}
            setKeyValue={setKeyValue}
            nameValue={nameValue}
            setNameValue={setNameValue}
            descriptionValue={descriptionValue}
            setDescriptionValue={setDescriptionValue}
            sortOrderValue={sortOrderValue}
            setSortOrderValue={setSortOrderValue}
            isActiveValue={isActiveValue}
            setIsActiveValue={setIsActiveValue}
            saving={saving}
            disableKey={disableKey}
            canSubmit={canSubmit}
            effectiveMode={effectiveMode}
            error={error}
            handleClose={handleClose}
            showShareToFeed={!!onShareToFeed}
            shareToFeed={shareToFeed}
            setShareToFeed={setShareToFeed}
          />
        </form>
      </div>
    </div>
  );
}

export default VportActorMenuCategoryFormModal;

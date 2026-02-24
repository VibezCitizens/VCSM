// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\services\components\owner\VportServicesOwnerToolbar.jsx

import React, { useMemo } from "react";

export default function VportServicesOwnerToolbar({
  dirty = false,
  isSaving = false,
  onSave = null,
}) {
  const canSave = dirty && !isSaving && typeof onSave === "function";

  const reasons = useMemo(() => {
    const r = [];

    if (!dirty) r.push("dirty=false (no changes)");
    if (isSaving) r.push("isSaving=true");
    if (typeof onSave !== "function") r.push("onSave is not a function");

    return r.length ? r.join(" | ") : "OK";
  }, [dirty, isSaving, onSave]);

  const handleSave = () => {
    if (canSave) return onSave();
    console.warn("[VportServicesOwnerToolbar] Save blocked:", reasons, {
      dirty,
      isSaving,
      onSaveType: typeof onSave,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-disabled={!canSave}
        onClick={handleSave}
        className={[
          "rounded-xl px-3 py-2 text-xs font-black border",
          canSave
            ? "border-sky-300/35 bg-sky-300/12 text-sky-100 hover:bg-sky-300/20"
            : "border-white/5 bg-black/20 text-white/30 cursor-not-allowed",
        ].join(" ")}
        title={!canSave ? reasons : "Save changes"}
      >
        {isSaving ? "Saving…" : dirty ? "Save" : "Saved"}
      </button>
    </div>
  );
}

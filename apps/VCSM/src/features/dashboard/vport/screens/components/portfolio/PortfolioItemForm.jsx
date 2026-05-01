import { useCallback, useRef, useState } from "react";
import { Image as ImageIcon, Tag, X } from "lucide-react";
import { usePortfolioMediaUpload } from "@/features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioMediaUpload";
import ConsentCheckbox from "@/features/auth/components/ConsentCheckbox";
import { usePortfolioItemSubmit } from "@/features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioItemSubmit";

const KIND_OPTIONS = [
  { value: "work", label: "Work Sample" },
  { value: "before_after", label: "Before & After" },
  { value: "style_card", label: "Style Card" },
  { value: "space", label: "Space / Setup" },
];

const TITLE_MAX = 22;

export default function PortfolioItemForm({
  mode = "create",
  editItemId = null,
  existingItem = null,
  initialValues = null,
  actorId,
  vportType,
  onOptimisticUpdate = null,
  onDone,
  onCancel,
}) {
  const isEdit = mode === "edit";
  const isLocksmith = String(vportType ?? "").toLowerCase() === "locksmith";

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [kind, setKind] = useState(initialValues?.kind ?? "work");
  const [tagsInput, setTagsInput] = useState(initialValues?.tagsInput ?? "");

  const lk = initialValues?.locksmith ?? null;
  const [jobType, setJobType] = useState(lk?.jobType ?? "other");
  const [propertyType, setPropertyType] = useState(lk?.propertyType ?? "");
  const [lockType, setLockType] = useState(lk?.lockType ?? "");
  const [hardwareBrand, setHardwareBrand] = useState(lk?.hardwareBrand ?? "");
  const [serviceMode, setServiceMode] = useState(lk?.serviceMode ?? "");
  const [isEmergencyJob, setIsEmergencyJob] = useState(lk?.isEmergencyJob ?? false);
  const [isSecurityUpgrade, setIsSecurityUpgrade] = useState(lk?.isSecurityUpgrade ?? false);
  const [estimatedDuration, setEstimatedDuration] = useState(lk?.estimatedDurationMinutes ?? "");

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);

  const { upload } = usePortfolioMediaUpload({ actorId });
  const existingMediaCount = initialValues?.existingMediaCount ?? 0;

  const { saving, error, handleSubmit } = usePortfolioItemSubmit({
    isEdit, editItemId, existingItem, actorId, files, title, description, kind,
    tagsInput, previews, onDone, isLocksmith, onOptimisticUpdate,
    jobType, propertyType, lockType, hardwareBrand, serviceMode,
    isEmergencyJob, isSecurityUpgrade, estimatedDuration, existingMediaCount, upload,
  });

  const handleFiles = useCallback((e) => {
    const selected = Array.from(e.target.files || []).slice(0, 10);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }, []);

  const removeFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const canSubmit = isEdit ? !saving : !saving && files.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base font-semibold text-white">
          {isEdit ? "Edit Portfolio Item" : "New Portfolio Item"}
        </div>
        <button type="button" onClick={onCancel} className="text-white/40 hover:text-white/70">
          <X size={18} />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {KIND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setKind(opt.value)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              kind === opt.value
                ? "border-sky-300/40 bg-sky-300/12 text-sky-100"
                : "border-white/8 bg-white/[0.03] text-white/40 hover:text-white/60",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
          onPaste={(e) => { e.preventDefault(); setTitle(e.clipboardData.getData("text").slice(0, TITLE_MAX)); }}
          maxLength={TITLE_MAX}
          className="w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
        />
        <div
          className="mt-1 text-right text-[11px] tabular-nums"
          style={{ color: title.length >= TITLE_MAX ? "#facc15" : "rgba(255,255,255,0.25)" }}
        >
          {title.length} / {TITLE_MAX}
        </div>
      </div>

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="mb-3 w-full resize-none rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
      />

      <div className="mb-3 flex items-center gap-2">
        <Tag size={14} className="shrink-0 text-white/30" />
        <input
          type="text"
          placeholder="Tags (comma separated — e.g. lockout, emergency, residential)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
        />
      </div>

      {isLocksmith ? (
        <div className="mb-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-white/35">Locksmith Details</div>
          <div className="grid grid-cols-2 gap-3">
            <select value={jobType} onChange={(e) => setJobType(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">
              <option value="other">Job Type</option>
              <option value="lockout">Lockout</option>
              <option value="rekey">Rekey</option>
              <option value="lock_change">Lock Change</option>
              <option value="new_install">New Install</option>
              <option value="repair">Repair</option>
              <option value="smart_lock">Smart Lock</option>
              <option value="safe">Safe</option>
              <option value="car_key">Car Key</option>
              <option value="commercial_hardware">Commercial Hardware</option>
              <option value="security_upgrade">Security Upgrade</option>
            </select>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">
              <option value="">Property Type</option>
              <option value="residential">Residential</option>
              <option value="automotive">Automotive</option>
              <option value="commercial">Commercial</option>
              <option value="safe">Safe / Vault</option>
            </select>
            <input placeholder="Lock type (e.g. deadbolt)" value={lockType} onChange={(e) => setLockType(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
            <input placeholder="Hardware brand" value={hardwareBrand} onChange={(e) => setHardwareBrand(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
            <select value={serviceMode} onChange={(e) => setServiceMode(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">
              <option value="">Service Mode</option>
              <option value="mobile">Mobile</option>
              <option value="shop">Shop</option>
              <option value="onsite_emergency">Onsite Emergency</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <input placeholder="Duration (minutes)" value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} type="number"
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
          </div>
          <div className="flex flex-wrap gap-4">
            <ConsentCheckbox checked={isEmergencyJob} onChange={() => setIsEmergencyJob((v) => !v)}>Emergency job</ConsentCheckbox>
            <ConsentCheckbox checked={isSecurityUpgrade} onChange={() => setIsSecurityUpgrade((v) => !v)}>Security upgrade</ConsentCheckbox>
          </div>
        </div>
      ) : null}

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      {isEdit && existingMediaCount > 0 && !files.length ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5 text-xs text-white/40">
          <ImageIcon size={13} className="shrink-0 text-white/25" />
          {existingMediaCount} existing photo{existingMediaCount !== 1 ? "s" : ""} — add more below
        </div>
      ) : null}

      {previews.length ? (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-lg bg-black/60 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              {kind === "before_after" && i < 2 ? (
                <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
                  {i === 0 ? "Before" : "After"}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-4 text-sm text-white/40 hover:border-white/25 hover:text-white/60 transition-colors"
      >
        <ImageIcon size={18} />
        {files.length
          ? `${files.length} new photo${files.length > 1 ? "s" : ""} selected — tap to change`
          : isEdit ? "Add more photos (optional)" : "Tap to add photos"}
      </button>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          {String(error?.message ?? error)}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={[
            "rounded-full px-5 py-2 text-sm font-semibold transition-all",
            saving ? "bg-white/8 text-white/30 cursor-wait"
              : !canSubmit ? "bg-white/5 text-white/25 cursor-not-allowed border border-white/8"
              : "border border-sky-300/40 bg-sky-300/15 text-sky-100 hover:bg-sky-300/22",
          ].join(" ")}
        >
          {saving ? (isEdit ? "Saving..." : "Uploading...") : (isEdit ? "Save changes" : "Publish")}
        </button>
      </div>
    </div>
  );
}

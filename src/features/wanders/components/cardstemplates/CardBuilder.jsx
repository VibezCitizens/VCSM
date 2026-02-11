// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\cardstemplates\CardBuilder.jsx
// src/features/wanders/components/cardstemplates/CardBuilder.jsx
import React, { useEffect, useMemo, useState } from "react";
import { templates } from "./registry";

function normalizeFormData(value) {
  // Turn undefined/null into "" so inputs never flip uncontrolled -> controlled
  if (value === undefined || value === null) return "";

  if (Array.isArray(value)) return value.map(normalizeFormData);

  if (typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = normalizeFormData(value[k]);
    return out;
  }

  return value;
}

export default function CardBuilder({
  defaultCardType = "generic",
  loading = false,
  error = null,
  onSubmit,
}) {
  const CARD_TYPES = useMemo(
    () => [
      { key: "generic", label: "Generic", sub: "Any occasion", icon: "📝" },
      { key: "birthday", label: "Birthday", sub: "Celebrate them", icon: "🎉" },
      { key: "valentines", label: "Valentine", sub: "Love notes", icon: "💝" },
      { key: "business", label: "Business", sub: "Professional intro", icon: "💼" },

      // ✅ NEW: Photo
      { key: "photo", label: "Photo", sub: "Add a picture", icon: "📷" },
    ],
    []
  );

  const availableTypes = useMemo(() => {
    const keys = Object.keys(templates);
    return CARD_TYPES.filter((t) => keys.includes(t.key));
  }, [CARD_TYPES]);

  const [cardType, setCardType] = useState(defaultCardType);

  const templateList = templates[cardType] || [];
  const [templateId, setTemplateId] = useState(templateList[0]?.id || "");

  useEffect(() => {
    const list = templates[cardType] || [];
    setTemplateId(list[0]?.id || "");
  }, [cardType]);

  const activeTemplate = useMemo(() => {
    const list = templates[cardType] || [];
    return list.find((t) => t.id === templateId) || list[0] || null;
  }, [cardType, templateId]);

  const [formData, setFormData] = useState(() =>
    normalizeFormData(activeTemplate?.defaultData || {})
  );

  useEffect(() => {
    if (!activeTemplate) return;
    setFormData(normalizeFormData(activeTemplate.defaultData || {}));
  }, [activeTemplate?.id]);

  const showTemplatePicker =
    !!activeTemplate &&
    !activeTemplate.hideTemplatePicker &&
    (templates[cardType]?.length || 0) > 1;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (loading || !activeTemplate) return;

    // Build payload from template (or raw formData)
    const raw = activeTemplate.toPayload ? activeTemplate.toPayload(formData) : formData;

    // ✅ Ensure the chosen template is ALWAYS included
    // backend can store template_key, frontend can use templateKey
    const payload = {
      ...raw,
      templateKey: raw?.templateKey ?? activeTemplate.id,
      template_key: raw?.template_key ?? raw?.templateKey ?? activeTemplate.id,
    };

    await onSubmit?.(payload);
  };

  const FormUI = activeTemplate?.Form || null;
  const PreviewUI = activeTemplate?.Preview || null;

  // --- Modern input theme (soft, clean, premium) ---
  const labelBase =
    "block text-[13px] font-semibold tracking-[0.01em] text-gray-900 mb-1.5";

  const inputBase =
    "w-full rounded-2xl border px-4 py-3 text-[15px] leading-6 " +
    "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 " +
    "shadow-[0_1px_0_0_rgba(0,0,0,0.04)] " +
    "transition duration-150 " +
    "hover:border-gray-300 " +
    "focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-black/10 " +
    "disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70 disabled:cursor-not-allowed";

  const textareaBase =
    inputBase +
    " align-top resize-none min-h-[120px]";

  const selectBase =
    inputBase +
    " appearance-none pr-10 " +
    "bg-[linear-gradient(45deg,transparent_50%,rgba(0,0,0,0.55)_50%),linear-gradient(135deg,rgba(0,0,0,0.55)_50%,transparent_50%)] " +
    "bg-[position:calc(100%-18px)_calc(50%+1px),calc(100%-13px)_calc(50%+1px)] " +
    "bg-[size:5px_5px,5px_5px] bg-no-repeat";

  const primaryBtn =
    "w-full rounded-2xl bg-black text-white py-3 text-sm font-semibold " +
    "shadow-[0_12px_30px_-18px_rgba(0,0,0,0.6)] " +
    "transition active:scale-[0.99] hover:bg-black/90 " +
    "focus:outline-none focus:ring-4 focus:ring-black/15 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const helperText = "mt-2 text-xs text-gray-500";

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(error?.message || error)}
        </div>
      ) : null}

      {/* Card type tiles */}
      <div>
        <div className={labelBase}>Card type</div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {availableTypes.map((t) => {
            const active = t.key === cardType;

            return (
              <button
                key={t.key}
                type="button"
                disabled={loading}
                onClick={() => setCardType(t.key)}
                className={[
                  "group relative overflow-hidden rounded-2xl border p-3 text-left transition",
                  "bg-white hover:bg-gray-50",
                  active ? "border-black ring-2 ring-black/10" : "border-gray-200",
                  loading ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <div
                  aria-hidden
                  className={[
                    "pointer-events-none absolute inset-0 opacity-0 transition",
                    active ? "opacity-100" : "",
                  ].join(" ")}
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))",
                  }}
                />

                <div className="relative flex items-start gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-xl border text-lg",
                      active ? "border-black bg-black text-white" : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    {t.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">{t.label}</div>
                    <div className="mt-1 truncate text-xs text-gray-600">{t.sub}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className={helperText}>This controls templates + required fields.</div>
      </div>

      {/* Template picker (only if 2+ templates) */}
      {showTemplatePicker ? (
        <div>
          <label className={labelBase}>Template</label>
          <select
            className={selectBase}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            disabled={loading}
          >
            {(templates[cardType] || []).map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.id}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Two-column: Form + Preview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* LEFT */}
        <form
          onSubmit={submit}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_30px_-25px_rgba(0,0,0,0.25)]"
        >
          {FormUI ? (
            <FormUI
              data={formData}
              setData={setFormData}
              ui={{
                labelBase,
                inputBase,
                textareaBase,
                selectBase,
                primaryBtn,
              }}
            />
          ) : null}

          <button type="submit" className={`${primaryBtn} mt-5`} disabled={loading || !activeTemplate}>
            {loading ? "Creating…" : "Create card"}
          </button>
        </form>

        {/* RIGHT */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_30px_-25px_rgba(0,0,0,0.25)]">
          <div className="text-sm font-semibold text-gray-900">Preview</div>
          <div className="mt-3">
            {PreviewUI ? <PreviewUI data={formData} /> : <div className="text-sm text-gray-600">No preview.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

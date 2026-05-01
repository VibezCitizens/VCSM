import { useEffect, useMemo, useState } from "react";
import { templates } from "@/features/wanders/components/cardstemplates/registry";
import { formatTemplateLabel } from "@/features/wanders/utils/formatTemplateLabel";
import { CardTypeTile } from "@/features/wanders/components/cardstemplates/cardBuilderTiles";
import {
  helperText,
  inputBase,
  labelBase,
  primaryBtn,
  selectBase,
  textareaBase,
} from "@/features/wanders/components/cardstemplates/cardBuilder.styles";

function normalizeFormData(value) {
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
      { key: "mothers_day", label: "Mother's Day", sub: "Premium holiday", icon: "💐" },
      { key: "teacher_appreciation", label: "Teacher Appreciation", sub: "May 4–8, 2026", icon: "🍎" },
      { key: "photo", label: "Photo", sub: "Add a picture", icon: "📷" },
      { key: "christmas", label: "Christmas", sub: "Holiday card", icon: "🎄" },
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
  }, [activeTemplate]);

  const showTemplatePicker =
    !!activeTemplate &&
    !activeTemplate.hideTemplatePicker &&
    (templates[cardType]?.length || 0) > 1;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (loading || !activeTemplate) return;

    const raw = activeTemplate.toPayload ? activeTemplate.toPayload(formData) : formData;

    const payload = {
      ...raw,
      templateKey: raw?.templateKey ?? activeTemplate.id,
      template_key: raw?.template_key ?? raw?.templateKey ?? activeTemplate.id,
    };

    await onSubmit?.(payload);
  };

  const FormUI = activeTemplate?.Form || null;
  const PreviewUI = activeTemplate?.Preview || null;

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(error?.message || error)}
        </div>
      ) : null}

      <div>
        <div className={labelBase}>Card type</div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {availableTypes.map((t) => (
            <CardTypeTile
              key={t.key}
              t={t}
              active={t.key === cardType}
              disabled={loading}
              onClick={() => setCardType(t.key)}
            />
          ))}
        </div>

        <div className={helperText}>This controls templates + required fields.</div>
      </div>

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
                {formatTemplateLabel(tpl.id)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
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

          <button
            type="submit"
            className={`${primaryBtn} mt-5`}
            disabled={loading || !activeTemplate}
          >
            {loading ? "Creating…" : "Create card"}
          </button>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_30px_-25px_rgba(0,0,0,0.25)]">
          <div className="text-sm font-semibold text-gray-900">Preview</div>
          <div className="mt-3">
            {PreviewUI ? (
              <PreviewUI data={formData} />
            ) : (
              <div className="text-sm text-gray-600">No preview.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

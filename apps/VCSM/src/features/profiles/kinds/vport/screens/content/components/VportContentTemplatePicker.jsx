// Template picker step shown before the create form.
// User selects a template or starts from blank.

import { getTemplatesForVportType } from "@/features/profiles/kinds/vport/screens/content/model/contentPageTemplates";

const CATEGORY_LABELS = {
  guide: "Guide",
  faq: "FAQ",
  emergency: "Emergency",
  tips: "Tips",
  educational: "Educational",
};

export function VportContentTemplatePicker({ vportType = null, onSelect, onBlank }) {
  const templates = getTemplatesForVportType(vportType);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-white/70 text-sm font-semibold mb-1">Start with a template</div>
        <div className="text-white/35 text-xs">Pick a starting point or begin from scratch.</div>
      </div>

      <div className="grid gap-2">
        {templates.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t)}
            className="text-left w-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-purple-400/30 rounded-xl px-4 py-3 transition group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-white text-sm font-semibold group-hover:text-purple-200 transition">
                {t.label}
              </span>
              {t.category && (
                <span className="text-white/30 text-xs shrink-0">
                  {CATEGORY_LABELS[t.category] ?? t.category}
                </span>
              )}
            </div>
            <div className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">
              {t.suggestedSummary}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onBlank}
        className="w-full text-center py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 border border-dashed border-white/12 hover:border-white/20 transition"
      >
        Start from blank
      </button>
    </div>
  );
}

export default VportContentTemplatePicker;

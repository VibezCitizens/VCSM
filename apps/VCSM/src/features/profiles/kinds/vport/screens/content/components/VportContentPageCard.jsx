// src/features/profiles/kinds/vport/screens/content/components/VportContentPageCard.jsx
// Public content card — displayed in the viewer grid on the profile.

const CATEGORY_META = {
  guide:       { label: "Guide",       color: "text-purple-300/90",  bar: "bg-purple-500/40" },
  faq:         { label: "FAQ",         color: "text-sky-300/90",     bar: "bg-sky-500/40" },
  emergency:   { label: "Emergency",   color: "text-rose-300/90",    bar: "bg-rose-500/40" },
  tips:        { label: "Tips",        color: "text-amber-300/90",   bar: "bg-amber-500/40" },
  educational: { label: "Educational", color: "text-teal-300/90",    bar: "bg-teal-500/40" },
};

const DEFAULT_META = { label: null, color: "text-white/40", bar: "bg-white/20" };

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function VportContentPageCard({ page, onClick }) {
  if (!page) return null;

  const meta = page.category ? (CATEGORY_META[page.category] ?? DEFAULT_META) : DEFAULT_META;
  const publishedDate = formatDate(page.publishedAt);

  return (
    <button
      type="button"
      onClick={() => onClick?.(page)}
      className="profiles-subcard w-full rounded-2xl text-left transition hover:bg-white/10 overflow-hidden group"
    >
      {page.coverImageUrl && (
        <div className="w-full h-[140px] overflow-hidden">
          <img
            src={page.coverImageUrl}
            alt={page.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      )}

      <div className="flex gap-3 p-4">
        {/* Category accent bar */}
        <div className={`shrink-0 w-1 rounded-full self-stretch ${meta.bar}`} />

        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {meta.label && (
            <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>
              {meta.label}
            </span>
          )}

          <div className="text-white font-semibold text-[14px] leading-snug line-clamp-2 group-hover:text-purple-100 transition-colors">
            {page.title}
          </div>

          {page.excerpt && (
            <div className="text-white/45 text-[12px] leading-relaxed line-clamp-2">
              {page.excerpt}
            </div>
          )}

          <div className="flex items-center justify-between mt-1">
            {publishedDate && (
              <span className="text-white/25 text-[11px]">{publishedDate}</span>
            )}
            <span className="text-purple-400/60 text-[11px] font-semibold ml-auto group-hover:text-purple-300 transition-colors">
              Read →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default VportContentPageCard;

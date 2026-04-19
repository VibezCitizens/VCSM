// src/features/profiles/kinds/vport/screens/content/components/VportContentPageCard.jsx
// Public content card — displayed in the viewer grid on the profile.

const CATEGORY_LABELS = {
  guide: "Guide",
  faq: "FAQ",
  emergency: "Emergency",
  tips: "Tips",
  educational: "Educational",
};

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function VportContentPageCard({ page, onClick }) {
  if (!page) return null;

  const categoryLabel = page.category ? CATEGORY_LABELS[page.category] ?? page.category : null;
  const publishedDate = formatDate(page.publishedAt);

  return (
    <button
      type="button"
      onClick={() => onClick?.(page)}
      className="profiles-subcard w-full rounded-2xl text-left transition hover:bg-white/10 overflow-hidden"
    >
      {page.coverImageUrl && (
        <div className="w-full h-[140px] overflow-hidden">
          <img
            src={page.coverImageUrl}
            alt={page.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-4 flex flex-col gap-2">
        {categoryLabel && (
          <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-purple-300/80">
            {categoryLabel}
          </span>
        )}

        <div className="text-white font-semibold text-[15px] leading-snug line-clamp-2">
          {page.title}
        </div>

        {page.summary && (
          <div className="text-white/50 text-[13px] leading-relaxed line-clamp-3">
            {page.summary}
          </div>
        )}

        {publishedDate && (
          <div className="text-white/30 text-[11px] mt-1">{publishedDate}</div>
        )}
      </div>
    </button>
  );
}

export default VportContentPageCard;

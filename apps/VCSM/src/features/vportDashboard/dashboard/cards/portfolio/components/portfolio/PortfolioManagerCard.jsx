import { Image as ImageIcon, Pencil, Sparkles, Trash2 } from "lucide-react";

export default function PortfolioManagerCard({ item, onEdit, onDelete, deleting }) {
  const coverUrl = item?.coverUrl ?? item?.media?.[0]?.url ?? null;
  const isTransformation = item?.portfolioKind === "before_after";
  const mediaCount = item?.mediaCount ?? 0;

  return (
    <div className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={20} className="text-white/15" />
          </div>
        )}
        {isTransformation ? (
          <span className="absolute top-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-amber-300">
            <Sparkles size={8} className="inline" /> B/A
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="truncate text-sm font-semibold text-white">
            {item.title || "Untitled"}
          </div>
          {item.tags?.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded bg-white/6 px-1.5 py-0.5 text-[10px] text-white/35">{t}</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {mediaCount > 0 ? (
            <span className="flex items-center gap-1 text-[10px] text-white/30">
              <ImageIcon size={10} />
              {mediaCount} {mediaCount === 1 ? "photo" : "photos"}
            </span>
          ) : null}
          {item.isFeatured ? (
            <span className="text-[10px] text-sky-300/60">Featured</span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 self-center flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onEdit?.(item)}
          className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors"
          aria-label="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete?.(item)}
          className="grid h-8 w-8 place-items-center rounded-xl border border-red-400/20 bg-red-400/8 text-red-300/60 hover:bg-red-400/15 disabled:opacity-50 transition-colors"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

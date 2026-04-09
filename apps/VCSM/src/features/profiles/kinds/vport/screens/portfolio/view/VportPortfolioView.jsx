// ============================================================
// VCSM — Vport Portfolio View (Engine-Backed)
// ============================================================

import { useMemo, useState } from "react";
import { Image as ImageIcon, Sparkles, Tag, X } from "lucide-react";
import { useVportPortfolio } from "@/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio";

import "@/features/profiles/styles/profiles-portfolio-modern.css";

function PortfolioItemCard({ item, onOpen }) {
  const coverUrl = item?.coverUrl ?? item?.media?.[0]?.url ?? null;
  const isTransformation = item?.portfolioKind === "before_after";
  const tags = item?.tags ?? [];

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all hover:border-white/15 hover:bg-white/[0.04]"
      onClick={() => onOpen?.(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.(item)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-white/5">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={item.title || "Portfolio work"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={32} className="text-white/15" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {isTransformation ? (
            <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-amber-300 backdrop-blur-sm">
              <Sparkles size={10} />
              Before & After
            </span>
          ) : null}
          {item.isFeatured ? (
            <span className="rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-sky-300 backdrop-blur-sm">
              Featured
            </span>
          ) : null}
        </div>

        {/* Media count */}
        {(item.mediaCount ?? 0) > 1 ? (
          <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            {item.mediaCount} photos
          </span>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-3">
        {item.title ? (
          <div className="truncate text-sm font-semibold text-white">{item.title}</div>
        ) : null}
        {tags.length ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] text-white/40">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PortfolioDetailModal({ item, detail, loading, onClose }) {
  if (!item) return null;

  const media = detail?.media ?? item?.media ?? [];
  const tags = detail?.tags ?? item?.tags ?? [];
  const barber = detail?.barberDetails ?? null;
  const locksmith = detail?.locksmithDetails ?? null;
  const coverUrl = item?.coverUrl ?? media?.[0]?.url ?? null;

  const beforeMedia = media.filter((m) => m.mediaRole === "before");
  const afterMedia = media.filter((m) => m.mediaRole === "after");
  const resultMedia = media.filter((m) => m.mediaRole === "result" || m.mediaRole === "detail" || m.mediaRole === "cover");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-xl bg-black/50 text-white/60 hover:text-white backdrop-blur-sm"
        >
          <X size={16} />
        </button>

        {/* Hero image */}
        {coverUrl ? (
          <div className="aspect-[4/3] overflow-hidden">
            <img src={coverUrl} alt={item.title || "Portfolio work"} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-white/40">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              Loading details...
            </div>
          ) : null}

          {/* Title */}
          {item.title ? (
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          ) : null}

          {/* Description */}
          {(detail?.description || item.description) ? (
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {detail?.description || item.description}
            </p>
          ) : null}

          {/* Before/After grid */}
          {beforeMedia.length > 0 && afterMedia.length > 0 ? (
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Before & After</div>
              <div className="grid grid-cols-2 gap-2">
                {beforeMedia.slice(0, 1).map((m) => (
                  <div key={m.id} className="relative overflow-hidden rounded-xl aspect-square">
                    <img src={m.url} alt="Before" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">Before</span>
                  </div>
                ))}
                {afterMedia.slice(0, 1).map((m) => (
                  <div key={m.id} className="relative overflow-hidden rounded-xl aspect-square">
                    <img src={m.url} alt="After" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-amber-300">After</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Additional media */}
          {resultMedia.length > 1 ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {resultMedia.slice(1, 7).map((m) => (
                <div key={m.id} className="overflow-hidden rounded-xl aspect-square">
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          {/* Barber details */}
          {barber ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {barber.haircutStyle ? (
                <span className="rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-white/60">{barber.haircutStyle}</span>
              ) : null}
              {barber.fadeType ? (
                <span className="rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-white/60">{barber.fadeType}</span>
              ) : null}
              {barber.hasBeard ? (
                <span className="rounded-lg border border-amber-300/15 bg-amber-300/8 px-2 py-1 text-xs text-amber-200/70">Beard</span>
              ) : null}
              {barber.hasDesign ? (
                <span className="rounded-lg border border-sky-300/15 bg-sky-300/8 px-2 py-1 text-xs text-sky-200/70">Design</span>
              ) : null}
              {barber.hasColor ? (
                <span className="rounded-lg border border-purple-300/15 bg-purple-300/8 px-2 py-1 text-xs text-purple-200/70">Color</span>
              ) : null}
            </div>
          ) : null}

          {/* Locksmith details */}
          {locksmith ? (
            <div className="mt-4">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/35">Job Details</div>
              <div className="flex flex-wrap gap-2">
                {locksmith.jobType ? (
                  <span className="rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-white/60 capitalize">{locksmith.jobType.replace(/_/g, ' ')}</span>
                ) : null}
                {locksmith.propertyType ? (
                  <span className="rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-white/60 capitalize">{locksmith.propertyType}</span>
                ) : null}
                {locksmith.lockType ? (
                  <span className="rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-white/60">{locksmith.lockType}</span>
                ) : null}
                {locksmith.hardwareBrand ? (
                  <span className="rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-white/60">{locksmith.hardwareBrand}</span>
                ) : null}
                {locksmith.isEmergencyJob ? (
                  <span className="rounded-lg border border-red-400/20 bg-red-400/8 px-2 py-1 text-xs text-red-200/70">Emergency</span>
                ) : null}
                {locksmith.isSecurityUpgrade ? (
                  <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/8 px-2 py-1 text-xs text-emerald-200/70">Security Upgrade</span>
                ) : null}
                {locksmith.serviceMode ? (
                  <span className="rounded-lg border border-sky-300/15 bg-sky-300/8 px-2 py-1 text-xs text-sky-200/70 capitalize">{locksmith.serviceMode.replace(/_/g, ' ')}</span>
                ) : null}
                {locksmith.estimatedDurationMinutes ? (
                  <span className="rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-white/50">~{locksmith.estimatedDurationMinutes} min</span>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Tags */}
          {tags.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-white/40">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function VportPortfolioView({
  profile,
  posts,
  loadingPosts = false,
  availableTabs = [],
  onSelectTab = null,
}) {
  const actorId = profile?.actor_id ?? profile?.actorId ?? null;
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    allTags,
    filterTag,
    setFilterTag,
    selectedItem,
    selectedItemDetail,
    loadingDetail,
    openItem,
    closeItem,
  } = useVportPortfolio(actorId);

  if (!actorId) return null;

  // Loading state
  if (loading) {
    return (
      <div className="profiles-card rounded-2xl p-5">
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          <div className="text-sm text-white/40">Loading portfolio...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profiles-card rounded-2xl p-5">
        <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          {String(error?.message ?? error)}
        </div>
      </div>
    );
  }

  // Empty state
  if (!items.length && !filterTag) {
    return (
      <div className="profiles-card rounded-2xl p-5">
        <div className="flex flex-col items-center gap-3 py-10">
          <ImageIcon size={32} className="text-white/15" />
          <div className="text-sm font-medium text-white/40">No work published yet</div>
          <div className="text-xs text-white/25">
            {profile?.displayName ?? "This business"} hasn't added portfolio items yet.
          </div>
          {availableTabs.some((t) => t.key === "services") ? (
            <button
              type="button"
              onClick={() => onSelectTab?.("services")}
              className="mt-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/50 hover:bg-white/8 transition-colors"
            >
              View services instead
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="profiles-card rounded-2xl p-5">
      {/* Header */}
      <div className="mb-4">
        <div className="text-base font-semibold text-white">Portfolio</div>
        <div className="mt-1 text-xs text-white/40">
          {items.length} {items.length === 1 ? "item" : "items"}
        </div>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterTag(null)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              !filterTag
                ? "border-sky-300/35 bg-sky-300/10 text-sky-100"
                : "border-white/8 bg-white/[0.03] text-white/40 hover:text-white/60",
            ].join(" ")}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filterTag === tag
                  ? "border-sky-300/35 bg-sky-300/10 text-sky-100"
                  : "border-white/8 bg-white/[0.03] text-white/40 hover:text-white/60",
              ].join(" ")}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {/* Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {items.map((item) => (
          <PortfolioItemCard key={item.id} item={item} onOpen={openItem} />
        ))}
      </div>

      {/* Load more */}
      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 w-full rounded-xl border border-white/8 bg-white/[0.02] py-3 text-center text-sm font-medium text-white/50 hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      ) : null}

      {/* Detail modal */}
      <PortfolioDetailModal
        item={selectedItem}
        detail={selectedItemDetail}
        loading={loadingDetail}
        onClose={closeItem}
      />
    </div>
  );
}

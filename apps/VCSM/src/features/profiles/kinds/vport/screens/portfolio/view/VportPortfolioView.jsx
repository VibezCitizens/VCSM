// ============================================================
// VCSM — Vport Portfolio View (Engine-Backed)
//
// CRITICAL: PortfolioItemModal is rendered as a SIBLING of the
// card container via a fragment, NOT inside it. On iOS, fixed
// elements inside scrollable/overflow containers get trapped
// in the parent's stacking context and fail to go fullscreen.
// Rendering as a sibling lets it escape.
// ============================================================

import { useState, useCallback } from "react";
import { Image as ImageIcon, Sparkles } from "lucide-react";
import { useTranslation } from "@i18n";
import { useVportPortfolio } from "@/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio";
import PortfolioItemModal from "@/features/profiles/kinds/vport/screens/portfolio/PortfolioItemModal";

import "@/features/profiles/styles/profiles-portfolio-modern.css";

function PortfolioItemCard({ item, onOpen }) {
  const { t } = useTranslation();
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

        <div className="absolute top-2 left-2 flex gap-1.5">
          {isTransformation ? (
            <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-amber-300 backdrop-blur-sm">
              <Sparkles size={10} />
              {t('vport.portfolioView.beforeAfter')}
            </span>
          ) : null}
          {item.isFeatured ? (
            <span className="rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-sky-300 backdrop-blur-sm">
              {t('vport.portfolioView.featured')}
            </span>
          ) : null}
        </div>

        {(item.mediaCount ?? 0) > 1 ? (
          <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            {t('vport.portfolioView.photos', { count: item.mediaCount })}
          </span>
        ) : null}
      </div>

      <div className="p-3">
        {item.title ? (
          <div className="line-clamp-2 text-sm font-semibold leading-snug text-white">{item.title}</div>
        ) : null}
        {tags.length ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-md bg-white/6 px-1.5 py-0.5 text-xs text-white/55">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function VportPortfolioView({
  profile,
  availableTabs = [],
  onSelectTab = null,
}) {
  const { t } = useTranslation();
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

  const [showModal, setShowModal] = useState(false);

  const handleOpenItem = useCallback(
    (item) => {
      openItem(item);
      setShowModal(true);
    },
    [openItem]
  );

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    closeItem();
  }, [closeItem]);

  if (!actorId) return null;

  if (loading) {
    return (
      <div className="profiles-card rounded-2xl p-5">
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          <div className="text-sm" style={{ color: 'var(--vc-text-muted)' }}>Loading portfolio...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profiles-card rounded-2xl p-5">
        <div className="rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/8 px-4 py-3 text-sm text-[#fecaca]">
          {String(error?.message ?? error)}
        </div>
      </div>
    );
  }

  if (!items.length && !filterTag) {
    return (
      <div className="profiles-card rounded-2xl p-5">
        <div className="flex flex-col items-center gap-3 py-10">
          <ImageIcon size={32} className="text-white/15" />
          <div className="text-sm font-medium" style={{ color: 'var(--vc-text-muted)' }}>{t('vport.portfolioView.noWorkYet')}</div>
          <div className="text-xs" style={{ color: 'var(--vc-text-muted)' }}>
            {t('vport.portfolioView.noItemsYet', { name: profile?.displayName ?? 'This business' })}
          </div>
          {availableTabs.some((tab) => tab.key === "services") ? (
            <button
              type="button"
              onClick={() => onSelectTab?.("services")}
              className="mt-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium transition-colors hover:bg-white/8"
              style={{ color: 'var(--vc-text-muted)' }}
            >
              {t('vport.portfolioView.viewServices')}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // Modal rendered as SIBLING via fragment — critical for iOS stacking context
  return (
    <>
      <div className="profiles-card rounded-2xl p-5">
        {/* Header */}
        <div className="mb-4">
          <div className="text-base font-semibold" style={{ color: 'var(--vc-text)' }}>{t('vport.portfolioView.title')}</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--vc-text-muted)' }}>
            {items.length === 1 ? t('vport.portfolioView.item', { count: items.length }) : t('vport.portfolioView.items', { count: items.length })}
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
                  ? "border-[#8b5cf6]/35 bg-[#8b5cf6]/10 text-[#c4b5fd]"
                  : "border-white/8 bg-white/[0.03] hover:text-white/60",
              ].join(" ")}
              style={filterTag ? { color: 'var(--vc-text-muted)' } : undefined}
            >
              {t('vport.portfolioView.all')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filterTag === tag
                    ? "border-[#8b5cf6]/35 bg-[#8b5cf6]/10 text-[#c4b5fd]"
                    : "border-white/8 bg-white/[0.03] hover:text-white/60",
                ].join(" ")}
                style={filterTag !== tag ? { color: 'var(--vc-text-muted)' } : undefined}
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}

        {/* Grid */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PortfolioItemCard key={item.id} item={item} onOpen={handleOpenItem} />
          ))}
        </div>

        {/* Load more */}
        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-4 w-full rounded-xl border border-white/8 bg-white/[0.02] py-3 text-center text-sm font-medium disabled:opacity-50 transition-colors hover:bg-white/5"
            style={{ color: 'var(--vc-text-muted)' }}
          >
            {loadingMore ? "Loading..." : t('vport.portfolioView.loadMore')}
          </button>
        ) : null}
      </div>

      {/* PortfolioItemModal — OUTSIDE the card div, at fragment level.
          Fixed elements inside overflow/transform containers get trapped on iOS. */}
      {showModal && selectedItem ? (
        <PortfolioItemModal
          item={selectedItem}
          detail={selectedItemDetail}
          loadingDetail={loadingDetail}
          onClose={handleCloseModal}
        />
      ) : null}
    </>
  );
}

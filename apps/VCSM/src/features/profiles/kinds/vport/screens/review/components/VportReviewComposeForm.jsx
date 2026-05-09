import React from "react";
import { Star, MessageSquare } from "lucide-react";
import { useTranslation } from "@i18n";
import { InputStars } from "@/features/profiles/kinds/vport/screens/review/components/VportReviewStars";

export function VportReviewComposeForm({
  canCompose,
  myExists,
  isEditing,
  reviewAuthorActorId,
  sessionActorId,
  targetActorId,
  dynamicDimensions,
  activeDimKey,
  setActiveDimKey,
  activeDimension,
  ratingsMap,
  setRatingsMap,
  normalizedRatings,
  ratedCount,
  totalDims,
  body,
  setBody,
  submitting,
  submitErr,
  onSubmit,
  onStartEdit,
  onCancelEdit,
}) {
  const { t } = useTranslation();

  if (canCompose && myExists && !isEditing) {
    return (
      <div className="mt-5 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <div className="text-sm text-white/60">{t('vport.reviewsView.alreadyReviewed')}</div>
        <button
          type="button"
          onClick={onStartEdit}
          className="rounded-full border border-sky-300/35 bg-sky-300/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-300/18 transition-colors"
        >
          {t('vport.reviewsView.editMyReview')}
        </button>
      </div>
    );
  }

  if (!canCompose || (!myExists && !isEditing)) {
    const showForm = isEditing || (!myExists && canCompose);
    if (!showForm) {
      return (
        <div className="mt-5 rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 text-sm text-white/40">
          {!sessionActorId
            ? t('vport.reviewsView.signInToReview')
            : !reviewAuthorActorId
              ? t('vport.reviewsView.switchToPersonal')
              : t('vport.reviewsView.cantReviewOwn')}
        </div>
      );
    }
  }

  // Full compose form
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4">
        <div className="text-base font-semibold text-white">
          {isEditing ? t('vport.reviewsView.editReview') : t('vport.reviewsView.writeReview')}
        </div>
        <div className="mt-1 text-xs text-white/45">
          {t('vport.reviewsView.rateEachCategory')}
        </div>
      </div>

      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
        Choose a category
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {dynamicDimensions.map((d) => {
          const isActive = d.key === activeDimKey;
          const val = Number(ratingsMap?.[d.key] ?? 0);
          const isRated = val >= 1 && val <= 5;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setActiveDimKey(d.key)}
              className={[
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "border-sky-300/40 bg-sky-300/12 text-sky-100"
                  : isRated
                    ? "border-amber-300/25 bg-amber-300/8 text-amber-200/80"
                    : "border-white/10 bg-black/20 text-white/50 hover:border-white/20 hover:text-white/70",
              ].join(" ")}
            >
              <span>{d.label}</span>
              {isRated ? (
                <span className="flex items-center gap-0.5 text-xs">
                  <Star size={10} fill="currentColor" strokeWidth={0} />
                  {val}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeDimension ? (
        <div className="rounded-xl border border-white/8 bg-black/15 px-4 py-4 mb-4">
          <div className="mb-2 text-sm font-medium text-white/80">
            How would you rate <span className="text-white">{activeDimension.label}</span>?
          </div>
          <div className="flex items-center justify-between gap-3">
            <InputStars
              value={Number(ratingsMap?.[activeDimension.key] ?? 0)}
              label={activeDimension.label}
              onChange={(next) => setRatingsMap((prev) => ({ ...(prev ?? {}), [activeDimension.key]: next }))}
            />
            <div className="text-sm font-semibold text-white/60">
              {Number(ratingsMap?.[activeDimension.key] ?? 0)
                ? `${Number(ratingsMap?.[activeDimension.key] ?? 0)} / 5`
                : "Not rated"}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-300/50 transition-all duration-300"
            style={{ width: totalDims > 0 ? `${(ratedCount / totalDims) * 100}%` : "0%" }}
          />
        </div>
        <div className="text-xs text-white/45 whitespace-nowrap">
          {ratedCount} of {totalDims} rated
        </div>
      </div>

      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/40 flex items-center gap-1.5">
        <MessageSquare size={11} />
        Comment (optional)
      </div>
      <textarea
        className="w-full min-h-20 resize-none rounded-xl border border-white/8 bg-black/20 p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors"
        rows={3}
        placeholder={t('vport.reviewsView.commentPlaceholder')}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {submitErr ? (
        <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          {String(submitErr?.message ?? submitErr)}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-white/35">
          {ratedCount > 0
            ? ratedCount === totalDims
              ? "All categories rated — ready to submit"
              : `${totalDims - ratedCount} more ${totalDims - ratedCount === 1 ? "category" : "categories"} to rate`
            : "Pick a category above to start"}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10 transition-colors"
            >
              {t('vport.reviewsView.cancel')}
            </button>
          ) : null}
          <button
            type="button"
            disabled={submitting || !normalizedRatings.length}
            onClick={onSubmit}
            className={[
              "rounded-full px-5 py-2 text-sm font-semibold transition-all",
              submitting
                ? "bg-white/8 text-white/30 cursor-wait"
                : !normalizedRatings.length
                  ? "bg-white/5 text-white/25 cursor-not-allowed border border-white/8"
                  : "border border-sky-300/40 bg-sky-300/15 text-sky-100 hover:bg-sky-300/22",
            ].join(" ")}
          >
            {submitting ? t('vport.reviewsView.submitting') : isEditing ? t('vport.reviewsView.updateReview') : t('vport.reviewsView.submitReview')}
          </button>
        </div>
      </div>
    </div>
  );
}

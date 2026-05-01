import {
  normalizeCtaType,
  resolveMotherDayPaletteClasses,
  safeTrim,
} from "./mothersDay.shared";

export function MothersDayPremiumPreview({ data }) {
  const palette = resolveMotherDayPaletteClasses(data?.palette);

  const title = safeTrim(data?.title) || "Happy Mother's Day";
  const subtitle = safeTrim(data?.subtitle);
  const message = safeTrim(data?.message) || "Your premium Mother's Day message appears here.";
  const ctaType = normalizeCtaType(data?.ctaType || data?.cta?.type, "none");
  const ctaLabel = safeTrim(data?.ctaLabel || data?.cta?.label) || "View Offer";
  const hero =
    safeTrim(data?.imageDataUrl) ||
    safeTrim(data?.image_data_url) ||
    safeTrim(data?.hero_image_url) ||
    safeTrim(data?.imageUrl) ||
    safeTrim(data?.image_url) ||
    "";

  return (
    <div className={`rounded-2xl border p-5 shadow-md min-h-[320px] flex flex-col justify-between overflow-hidden ${palette.shell}`}>
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette.badge}`}>
            Mother's Day Premium
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Vibez</div>
        </div>

        {hero ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/15">
            <img src={hero} alt="Hero preview" className="h-32 w-full object-cover" />
          </div>
        ) : null}

        <h2 className={`mt-4 text-2xl font-semibold leading-tight ${palette.title}`}>{title}</h2>
        {subtitle ? <div className={`mt-2 text-sm ${palette.subtitle}`}>{subtitle}</div> : null}

        <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-4">
          <p className={`whitespace-pre-wrap text-sm leading-6 ${palette.body}`}>{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <div className={`text-sm font-medium ${palette.subtitle}`}>
          {data?.sendAnonymously || !safeTrim(data?.fromName)
            ? "— With love"
            : `— ${safeTrim(data?.fromName)}`}
        </div>

        {ctaType !== "none" ? (
          <div className="rounded-lg border border-pink-300/40 bg-pink-500/25 px-3 py-1.5 text-xs font-semibold text-pink-50">
            {ctaLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

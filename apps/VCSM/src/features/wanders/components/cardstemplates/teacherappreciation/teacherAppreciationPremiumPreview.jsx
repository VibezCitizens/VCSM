import {
  normalizeCtaType,
  resolveTeacherAppreciationPaletteClasses,
  safeTrim,
} from "./teacherAppreciation.shared";

export function TeacherAppreciationPremiumPreview({ data }) {
  const palette = resolveTeacherAppreciationPaletteClasses(data?.palette);
  const title = safeTrim(data?.title) || "Thank You for Everything";
  const subtitle = safeTrim(data?.subtitle);
  const message = safeTrim(data?.message) || "Your premium card message preview appears here.";
  const teacherName = safeTrim(data?.teacherName);
  const classroomName = safeTrim(data?.classroomName);
  const schoolName = safeTrim(data?.schoolName);
  const ctaType = normalizeCtaType(data?.ctaType, "none");
  const ctaLabel = safeTrim(data?.ctaLabel) || "View Offer";
  const hero =
    safeTrim(data?.imageDataUrl) ||
    safeTrim(data?.image_data_url) ||
    safeTrim(data?.hero_image_url) ||
    safeTrim(data?.imageUrl) ||
    "";

  const metaLine = [classroomName, schoolName].filter(Boolean).join(" · ");

  return (
    <div
      className={`rounded-2xl border p-5 shadow-md min-h-[320px] flex flex-col justify-between overflow-hidden ${palette.shell}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette.badge}`}
          >
            🍎 Teacher Appreciation
          </div>
          {metaLine ? (
            <div className="text-[11px] font-semibold tracking-[0.06em] text-white/50 uppercase truncate max-w-[120px]">
              {metaLine}
            </div>
          ) : null}
        </div>

        {hero ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/15">
            <img src={hero} alt="Hero preview" className="h-32 w-full object-cover" />
          </div>
        ) : null}

        {teacherName ? (
          <div className={`mt-4 text-xs font-semibold uppercase tracking-[0.12em] ${palette.subtitle}`}>
            To {teacherName}
          </div>
        ) : null}

        <h2 className={`mt-2 text-2xl font-semibold leading-tight ${palette.title}`}>{title}</h2>
        {subtitle ? (
          <div className={`mt-2 text-sm ${palette.subtitle}`}>{subtitle}</div>
        ) : null}

        <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-4">
          <p className={`whitespace-pre-wrap text-sm leading-6 ${palette.body}`}>{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <div className={`text-sm font-medium ${palette.subtitle}`}>
          {data?.sendAnonymously || !safeTrim(data?.fromName)
            ? "— With gratitude"
            : `— ${safeTrim(data?.fromName)}`}
        </div>

        {ctaType !== "none" ? (
          <div className="rounded-lg border border-amber-300/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-50">
            {ctaLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

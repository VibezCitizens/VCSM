// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\CommunitySuggestionBadge.jsx

export function CommunitySuggestionBadge({
  submission,
  showMeta = true,
}) {
  if (!submission) return null;

  const {
    proposedPrice,
    currencyCode = "USD",
    unit = "liter",
    submittedAt,
  } = submission;

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleString()
    : null;

  return (
    <div className="inline-flex flex-col gap-1 rounded-2xl border border-purple-800 bg-purple-950/40 px-3 py-2">
      <div className="text-xs font-semibold text-purple-300">
        Community suggestion
      </div>

      <div className="text-sm font-semibold text-white">
        {proposedPrice ?? "—"}{" "}
        <span className="text-xs text-neutral-300">
          {currencyCode}/{unit}
        </span>
      </div>

      {showMeta && formattedDate && (
        <div className="text-[11px] text-neutral-400">
          Submitted {formattedDate}
        </div>
      )}
    </div>
  );
}
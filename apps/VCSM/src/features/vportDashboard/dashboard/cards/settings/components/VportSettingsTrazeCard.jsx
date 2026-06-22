import { Card } from "@/features/settings/adapters/settings.adapter";

function getInlineTrazeStatus(visible, cityId, status) {
  if (status === "suspended") return null;
  if (!visible) return { text: "Hidden from TRAZE", color: "rgba(161,161,170,0.65)" };
  if (cityId) return { text: "Visible on TRAZE", color: "rgba(110,231,183,0.80)" };
  return null;
}

export default function VportSettingsTrazeCard({
  directoryVisible,
  directoryStatus,
  directoryLoading,
  directorySaving,
  directoryError,
  toggleDirectoryVisible,
  draftCityId,
  draftAddressCity,
}) {
  const isSuspended = directoryStatus === "suspended";
  const inlineStatus = getInlineTrazeStatus(directoryVisible, draftCityId, directoryStatus);

  return (
    <Card>
      <div className="space-y-3">
        <div className="text-sm font-semibold text-zinc-100">TRAZE Directory</div>

        {directoryLoading ? (
          <div className="text-xs text-zinc-500">Loading…</div>
        ) : (
          <>
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm text-zinc-200">Show on TRAZE directory</div>
                {inlineStatus && (
                  <div className="mt-0.5 text-xs" style={{ color: inlineStatus.color }}>
                    {inlineStatus.text}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => !isSuspended && toggleDirectoryVisible(!directoryVisible)}
                disabled={isSuspended || directorySaving || directoryVisible === null}
                aria-label={directoryVisible ? "Hide from TRAZE directory" : "Show on TRAZE directory"}
                className={`settings-toggle ml-3 shrink-0 ${directoryVisible ? "is-on" : "is-off"} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>

            {directoryVisible && !draftAddressCity && (
              <p className="text-xs text-amber-400">
                Add your city in the Address section to appear correctly on TRAZE.
              </p>
            )}
            {isSuspended && (
              <p className="text-xs text-rose-400">
                This Vport has been suspended from the TRAZE directory.
              </p>
            )}
            {directoryError && (
              <p className="text-xs text-rose-400">{directoryError}</p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

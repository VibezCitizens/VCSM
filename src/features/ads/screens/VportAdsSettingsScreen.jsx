import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import "@/features/settings/styles/settings-modern.css";
import { useVportAds } from "@/features/ads/hooks/useVportAds";
import { AdEditor, AdsEmptyState, AdsList } from "@/features/ads/ui/adsPipeline.ui";
import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";

export default function VportAdsSettingsScreen() {
  const navigate = useNavigate();
  const { actorId: actorIdParam } = useParams();
  const { identity } = useIdentity();

  const actorId = actorIdParam || identity?.actorId || null;
  const isDesktop = useDesktopBreakpoint();
  const shell = useMemo(
    () => createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1100 }),
    [isDesktop]
  );
  const { ads, loading, saving, error, createDraft, saveDraft, publish, pause, archive, remove } = useVportAds(actorId);

  const [selectedId, setSelectedId] = useState(null);
  const [localDraft, setLocalDraft] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const selectedAd = useMemo(() => {
    if (!selectedId) return null;
    return ads.find((item) => item.id === selectedId) || null;
  }, [ads, selectedId]);

  const draft = localDraft && localDraft.id === selectedAd?.id ? localDraft : selectedAd;

  const onCreate = () => {
    const created = createDraft();
    setSelectedId(created.id);
    setLocalDraft(created);
    setFieldErrors({});
  };

  const wrapSave = async (action, ad) => {
    setFieldErrors({});
    try {
      const saved = await action(ad);
      setSelectedId(saved?.id || ad.id);
      setLocalDraft(null);
    } catch (err) {
      setFieldErrors(err?.fieldErrors || {});
    }
  };

  const content = (
    <div className="settings-modern-page relative min-h-[100dvh] w-full overflow-y-auto text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-300/10 bg-[#060914]/72 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <VportBackButton
              isDesktop={isDesktop}
              onClick={() => navigate(-1)}
              style={shell.btn("soft")}
            />
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Megaphone className="h-4 w-4 text-indigo-300" />
              VPORT Ads Pipeline
            </div>
          </div>

          <button onClick={onCreate} className="settings-btn settings-btn--primary inline-flex items-center gap-2 border px-3 py-1.5 text-xs">
            <Plus className="h-4 w-4" />
            New ad
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 pb-24 pt-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="settings-card-surface rounded-2xl px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Monetization</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">Coming soon</div>
            <div className="mt-1 text-xs text-slate-400">
              Ads can be created and managed now. Pricing and payout controls will be enabled later.
            </div>
          </div>

          {loading ? (
            <div className="settings-card-surface rounded-2xl px-4 py-4 text-sm text-slate-400">Loading ads...</div>
          ) : ads.length === 0 ? (
            <AdsEmptyState onCreate={onCreate} />
          ) : (
            <AdsList
              ads={ads}
              selectedId={selectedId || ads[0]?.id}
              onSelect={(ad) => {
                setSelectedId(ad.id);
                setLocalDraft(null);
                setFieldErrors({});
              }}
            />
          )}
        </section>

        <section className="space-y-3">
          {error ? (
            <div className="settings-card-surface rounded-2xl px-4 py-3 text-sm text-rose-300">
              {error.message || "Failed to process ad action."}
            </div>
          ) : null}

          {!ads.length && !draft ? (
            <div className="settings-card-surface rounded-2xl px-4 py-8 text-center text-sm text-slate-400">
              Create an ad to open the editor.
            </div>
          ) : (
            <AdEditor
              draft={draft || ads[0]}
              fieldErrors={fieldErrors}
              saving={saving}
              onChange={(next) => {
                setLocalDraft(next);
                setSelectedId(next.id);
              }}
              onSave={(ad) => wrapSave(saveDraft, ad)}
              onPublish={(ad) => wrapSave(publish, ad)}
              onPause={(ad) => wrapSave(pause, ad)}
              onArchive={(ad) => wrapSave(archive, ad)}
              onDelete={async (ad) => {
                await remove(ad.id);
                setLocalDraft(null);
                setFieldErrors({});
                if (selectedId === ad.id) {
                  setSelectedId(null);
                }
              }}
            />
          )}
        </section>
      </main>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "auto",
          background: "#000",
        }}
      >
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

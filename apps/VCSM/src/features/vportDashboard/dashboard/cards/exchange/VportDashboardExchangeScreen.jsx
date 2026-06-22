import { useCallback } from "react";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useVportDashboardContext } from "@/features/vportDashboard/adapters/vportDashboard.adapter";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import VportBackButton from "@/shared/ui/dashboard/BackButton";
import { createVportDashboardShellStyles } from "@/features/vportDashboard/screens/styles/vportDashboardShellStyles";
import Toast from "@/shared/components/components/Toast";

import VportRatesView from "@/features/profiles/kinds/vport/adapters/screens/rates/view/VportRatesView.adapter";
import VportRateEditorCard from "@/features/profiles/kinds/vport/adapters/screens/rates/components/VportRateEditorCard.adapter";

import { useExchangeRateEditor } from "./hooks/useExchangeRateEditor";

export function VportDashboardExchangeScreen() {
  const navigate = useNavigate();
  const { identity, identityLoading } = useIdentity();
  const isDesktop = useDesktopBreakpoint();

  const { loading: ownershipLoading, vportActorId: actorId, canManage: isOwner } = useVportDashboardContext();

  const {
    baseCurrency, setBaseCurrency,
    quoteCurrency, setQuoteCurrency,
    buyRate, setBuyRate,
    sellRate, setSellRate,
    refreshSeed,
    optimisticRates,
    toastOpen, setToastOpen,
    toastMessage,
    shareToFeed, setShareToFeed,
    isLoading,
    error,
    onSave,
  } = useExchangeRateEditor({ actorId });

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  if (!actorId) return null;
  if (identityLoading || ownershipLoading)
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  if (!identity)
    return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  if (!isOwner)
    return (
      <div className="p-10 text-center text-white/50">
        You can only manage exchange rates for your own vport.
      </div>
    );

  const profile = { actorId, actor_id: actorId };
  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1280 });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={goBack} />
            <div style={shell.title}>EXCHANGE RATES</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: "0 16px 8px 16px" }}>
            <VportRateEditorCard
              title="Update Rate"
              baseCurrency={baseCurrency}
              quoteCurrency={quoteCurrency}
              buyRate={buyRate}
              sellRate={sellRate}
              onChangeBaseCurrency={setBaseCurrency}
              onChangeQuoteCurrency={setQuoteCurrency}
              onChangeBuyRate={setBuyRate}
              onChangeSellRate={setSellRate}
              onSubmit={onSave}
              submitting={isLoading}
              error={error}
              disabled={false}
              shareToFeed={shareToFeed}
              onToggleShareToFeed={setShareToFeed}
            />
          </div>

          <div style={{ padding: "0 0 6px 0" }}>
            <VportRatesView
              profile={profile}
              actorId={actorId}
              rateType="fx"
              title="Exchange Rates"
              subtitle="Official rates - last updated shown per pair"
              refreshSeed={refreshSeed}
              optimisticRates={optimisticRates}
            />
          </div>
        </div>
      </div>
      <Toast
        open={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

export default VportDashboardExchangeScreen;

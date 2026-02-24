import React, { useMemo, useState, useCallback } from "react";
import { useIdentity } from "@/state/identity/identityContext";

import VportRatesView from "@/features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx";
import VportRateEditorCard from "@/features/profiles/kinds/vport/screens/rates/components/VportRateEditorCard.jsx";
import useUpsertVportRate from "@/features/profiles/kinds/vport/hooks/rates/useUpsertVportRate.js";

export default function VportRatesOwnerView({
  profile = null,
  actorId: actorIdProp = null,
  rateType = "fx",
  title = "Exchange Rates",
  subtitle = "Official rates • last updated shown per pair",
} = {}) {
  const { identity } = useIdentity();

  const targetActorId = useMemo(() => {
    return actorIdProp ?? profile?.actorId ?? profile?.actor_id ?? null;
  }, [actorIdProp, profile]);

  const isOwner = useMemo(() => {
    const me = identity?.actorId ?? null;
    return me && targetActorId && String(me) === String(targetActorId);
  }, [identity, targetActorId]);

  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [quoteCurrency, setQuoteCurrency] = useState("MXN");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [refreshSeed, setRefreshSeed] = useState(0);

  const m = useUpsertVportRate();

  const onSubmit = useCallback(async () => {
    if (!targetActorId) return;

    await m.mutateAsync({
      actorId: targetActorId,
      rateType,
      baseCurrency,
      quoteCurrency,
      buyRate,
      sellRate,
    });

    setBuyRate("");
    setSellRate("");
    setRefreshSeed((n) => n + 1); // ✅ force re-fetch
  }, [
    m,
    targetActorId,
    rateType,
    baseCurrency,
    quoteCurrency,
    buyRate,
    sellRate,
  ]);

  return (
    <div className="space-y-4">
      <VportRateEditorCard
        title={isOwner ? "Update Rate" : "Rates (read-only)"}
        baseCurrency={baseCurrency}
        quoteCurrency={quoteCurrency}
        buyRate={buyRate}
        sellRate={sellRate}
        onChangeBaseCurrency={setBaseCurrency}
        onChangeQuoteCurrency={setQuoteCurrency}
        onChangeBuyRate={setBuyRate}
        onChangeSellRate={setSellRate}
        onSubmit={onSubmit}
        submitting={m.isPending}
        error={m.error?.message ?? m.error ?? null}
        disabled={!isOwner}
      />

      <VportRatesView
        profile={profile}
        actorId={targetActorId}
        rateType={rateType}
        title={title}
        subtitle={subtitle}
        refreshSeed={refreshSeed}
      />
    </div>
  );
}

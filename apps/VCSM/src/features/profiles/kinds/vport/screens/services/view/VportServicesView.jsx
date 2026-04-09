// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\services\view\VportServicesView.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";

import VportServicesPanel from "@/features/profiles/kinds/vport/screens/services/components/VportServicesPanel";
import VportServicesSkeleton from "@/features/profiles/kinds/vport/screens/services/components/VportServicesSkeleton";
import VportServicesOwnerPanel from "@/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerPanel";

import useVportServices from "@/features/profiles/kinds/vport/hooks/services/useVportServices";
import { useLocksmithProfile } from "@/features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile";
import useUpsertVportServices from "@/features/profiles/kinds/vport/hooks/services/useUpsertVportServices";
import {
  applyEnabledMapToServices,
  buildEnabledMap,
  mapsEqual,
  toServiceKey,
} from "@/features/profiles/kinds/vport/screens/services/model/vportServicesEnabledMap.model";

export default function VportServicesView({
  profile = null,
  viewerActorId = null,
  actorId: actorIdProp = null,
  vportType = null,

  // ✅ NEW: only dashboard should enable owner editing
  allowOwnerEditing = false,
}) {
  const targetActorId = useMemo(() => {
    return actorIdProp ?? profile?.actorId ?? profile?.actor_id ?? null;
  }, [actorIdProp, profile]);

  // ✅ true only when viewer owns this vport
  const isOwner = useMemo(() => {
    return (
      Boolean(viewerActorId) && String(viewerActorId) === String(targetActorId)
    );
  }, [viewerActorId, targetActorId]);

  // ✅ owner UI only when explicitly allowed (dashboard)
  const ownerUiEnabled = useMemo(() => {
    return Boolean(allowOwnerEditing) && isOwner;
  }, [allowOwnerEditing, isOwner]);

  // ✅ hook: only request owner mode if owner UI enabled
  const s = useVportServices({
    identityActorId: viewerActorId,
    targetActorId,
    asOwner: ownerUiEnabled, // ✅ changed
    vportType,
  });

  const mode = s.data?.mode ?? "viewer";
  const servicesFromApi = useMemo(
    () => (Array.isArray(s.data?.services) ? s.data.services : []),
    [s.data?.services]
  );
  const readError = s.error ?? s.data?.error ?? null;

  const resolvedVportType = useMemo(() => {
    return s.data?.vportType ?? vportType ?? null;
  }, [s.data?.vportType, vportType]);

  const { isLocksmith, serviceDetails: locksmithDetails } = useLocksmithProfile(targetActorId, resolvedVportType);

  // ===== owner draft logic (still computed, but only used in owner render) =====
  const baseEnabledMap = useMemo(
    () => buildEnabledMap(servicesFromApi),
    [servicesFromApi]
  );

  const [draftEnabledMap, setDraftEnabledMap] = useState(() => baseEnabledMap);

  useEffect(() => {
    setDraftEnabledMap((prev) => {
      if (mapsEqual(prev, baseEnabledMap)) return prev;
      return baseEnabledMap;
    });
  }, [baseEnabledMap]);

  const dirty = useMemo(
    () => !mapsEqual(baseEnabledMap, draftEnabledMap),
    [baseEnabledMap, draftEnabledMap]
  );

  const draftServices = useMemo(() => {
    return applyEnabledMapToServices(servicesFromApi, draftEnabledMap);
  }, [servicesFromApi, draftEnabledMap]);

  const onToggleService = useCallback(({ key, enabled }) => {
    const k = toServiceKey(key);
    if (!k) return;

    setDraftEnabledMap((prev) => {
      const next = new Map(prev);
      next.set(k, Boolean(enabled));
      return next;
    });
  }, []);

  const onReset = useCallback(() => {
    setDraftEnabledMap(baseEnabledMap);
  }, [baseEnabledMap]);

  // ✅ REAL SAVE (writes to vc.vport_services via your hook/controller/DAL)
  const upsert = useUpsertVportServices({
    targetActorId,
    vportType: resolvedVportType,
    onSuccess: async () => {
      // refresh server state so dirty becomes false
      if (typeof s.refetch === "function") await s.refetch();
    },
  });

  const onSave = useCallback(async () => {
    if (!dirty) return;

    if (!targetActorId) throw new Error("VportServicesView: targetActorId missing");
    if (!resolvedVportType) throw new Error("VportServicesView: vportType missing");

    const changes = [];
    for (const [k, v] of draftEnabledMap.entries()) {
      const baseV = baseEnabledMap.get(k);
      if (baseV !== v) changes.push({ key: k, enabled: v });
    }

    await upsert.mutate({ items: changes });
  }, [
    dirty,
    targetActorId,
    resolvedVportType,
    draftEnabledMap,
    baseEnabledMap,
    upsert,
  ]);

  const isSaving = Boolean(upsert.isPending);
  const error = upsert.error ?? readError;

  // Enrich services with locksmith-specific detail metadata
  // (must be called unconditionally — before any early returns — to preserve hooks order)
  const enrichedServices = useMemo(() => {
    if (!isLocksmith || !locksmithDetails?.length) return servicesFromApi;

    const detailMap = new Map();
    for (const d of locksmithDetails) {
      if (d.serviceId) detailMap.set(d.serviceId, d);
    }

    return servicesFromApi.map((svc) => {
      const detail = detailMap.get(svc.id ?? svc.serviceId);
      if (!detail) return svc;

      const parts = [];
      if (detail.serviceFamily) parts.push(detail.serviceFamily);
      if (detail.isEmergency) parts.push('Emergency available');
      if (detail.isMobileService) parts.push('Mobile service');
      if (detail.isAfterHoursAvailable) parts.push('After-hours');
      if (detail.pricingModel === 'starting_at' && detail.startingPriceCents != null) {
        parts.push(`Starting at $${(detail.startingPriceCents / 100).toFixed(0)}`);
      }
      if (detail.pricingModel === 'quote') parts.push('Quote required');
      if (detail.etaMinMinutes != null && detail.etaMaxMinutes != null) {
        parts.push(`ETA ${detail.etaMinMinutes}–${detail.etaMaxMinutes} min`);
      }
      if (detail.warrantyDays) parts.push(`${detail.warrantyDays}-day warranty`);

      return { ...svc, meta: parts.join(' · ') || svc.meta };
    });
  }, [servicesFromApi, isLocksmith, locksmithDetails]);

  if (!targetActorId) {
    return <div className="p-6 text-sm text-neutral-400">Invalid vport.</div>;
  }

  if (s.isLoading) {
    return <VportServicesSkeleton />;
  }

  // ✅ only show owner editor when explicitly enabled (dashboard)
  if (ownerUiEnabled && mode === "owner") {
    return (
      <VportServicesOwnerPanel
        loading={Boolean(s.isLoading)}
        error={error}
        services={draftServices}
        dirty={dirty}
        isSaving={isSaving}
        onSave={onSave}
        onReset={onReset}
        onToggleService={onToggleService}
        onEditServiceMeta={null}
        title="Services"
        subtitle="Manage your services and add-ons."
      />
    );
  }

  // ✅ otherwise always viewer panel (even if owner)
  return (
    <VportServicesPanel
      loading={Boolean(s.isLoading)}
      error={readError}
      services={enrichedServices}
      title="Services"
      subtitle={isLocksmith ? "Locksmith services and emergency capabilities." : "Capabilities and amenities offered by this vport."}
    />
  );
}

// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\services\view\VportServicesView.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";

import VportServicesPanel from "@/features/profiles/kinds/vport/screens/services/components/VportServicesPanel";
import VportServicesSkeleton from "@/features/profiles/kinds/vport/screens/services/components/VportServicesSkeleton";
import VportServicesOwnerPanel from "@/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerPanel";

import useVportServices from "@/features/profiles/kinds/vport/hooks/services/useVportServices";
import useUpsertVportServices from "@/features/profiles/kinds/vport/hooks/services/useUpsertVportServices";

function toKey(v) {
  return (v ?? "").toString().trim();
}

function buildEnabledMap(services) {
  const m = new Map();
  (services ?? []).forEach((s) => {
    const k = toKey(s?.key ?? s?.serviceKey ?? s?.id);
    if (!k) return;

    const enabled =
      typeof s?.enabled === "boolean"
        ? s.enabled
        : typeof s?.is_enabled === "boolean"
          ? s.is_enabled
          : s?.enabled !== false;

    m.set(k, Boolean(enabled));
  });
  return m;
}

function applyEnabledMapToServices(services, enabledMap) {
  return (services ?? []).map((s) => {
    const k = toKey(s?.key ?? s?.serviceKey ?? s?.id);
    if (!k) return s;

    const nextEnabled = enabledMap.has(k) ? enabledMap.get(k) : s?.enabled;

    return {
      ...s,
      key: s?.key ?? k,
      enabled: Boolean(nextEnabled),
    };
  });
}

function mapsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const [k, v] of a.entries()) {
    if (!b.has(k) || b.get(k) !== v) return false;
  }
  return true;
}

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

  useEffect(() => {
    const snap = {
      viewerActorId: viewerActorId ?? null,
      targetActorId: targetActorId ?? null,
      isOwner,
      allowOwnerEditing,
      ownerUiEnabled,
      vportTypeProp: vportType ?? null,
    };

    console.groupCollapsed("[VportServicesView][DEBUG props]");
    console.debug(snap);
    console.groupEnd();
  }, [
    viewerActorId,
    targetActorId,
    isOwner,
    allowOwnerEditing,
    ownerUiEnabled,
    vportType,
  ]);

  // ✅ hook: only request owner mode if owner UI enabled
  const s = useVportServices({
    identityActorId: viewerActorId,
    targetActorId,
    asOwner: ownerUiEnabled, // ✅ changed
    vportType,
  });

  const mode = s.data?.mode ?? "viewer";
  const servicesFromApi = s.data?.services ?? [];
  const readError = s.error ?? s.data?.error ?? null;

  const resolvedVportType = useMemo(() => {
    return s.data?.vportType ?? vportType ?? null;
  }, [s.data?.vportType, vportType]);

  useEffect(() => {
    const snap = {
      isLoading: Boolean(s?.isLoading),
      error: s?.error ? String(s.error?.message ?? s.error) : null,
      dataVportType: s?.data?.vportType ?? null,
      mode: s?.data?.mode ?? null,
      servicesCount: (s?.data?.services ?? []).length,
    };

    console.groupCollapsed("[VportServicesView][DEBUG hook]");
    console.debug(snap);
    console.groupEnd();
  }, [s?.isLoading, s?.error, s?.data]);

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
    const k = toKey(key);
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

  console.log("[ServicesView]", {
    mode,
    isOwner,
    allowOwnerEditing,
    ownerUiEnabled,
    viewerActorId,
    targetActorId,
    servicesCount: servicesFromApi.length,
    vportType: resolvedVportType,
    dirty,
  });

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
      services={servicesFromApi}
      title="Services"
      subtitle="Capabilities and amenities offered by this vport."
    />
  );
}
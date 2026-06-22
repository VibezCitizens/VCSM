import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/providers/AuthProvider";
import { saveIdentity } from "@/features/identity/identityStorage";
import { invalidateIdentityResultCache } from "@identity";
import { purgeChatMessageCache, purgeNotificationCache, invalidateBootstrap } from "@/bootstrap/bootstrap.invalidate";
import { debugLoginEvent } from "@debuggers/identity";
import { debugFeedViewer } from "@debuggers/feed";
import {
  useIdentityEngineQuery,
  invalidateIdentityEngineQuery,
} from "@/features/identity/queries/identityEngineQuery";
import { switchActorController } from "@/features/identity/controller/switchActor.controller";
import {
  getIdentityEngineContext,
  isBlockedVportIdentity,
  toPublicIdentity,
} from "@/features/identity/identity.model";
import { useIdentityResolutionEffect } from "@/features/identity/useIdentityResolutionEffect.hook";
import { useActorStore } from "@hydration";
import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";
import { useIdentitySelectionStore } from "@/features/identity/identitySelection.store";

const IdentityContext = createContext(null);
const IdentityDetailsContext = createContext(null);

export function IdentityProvider({ children }) {
  const { user, loading: authLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  const [identity, setPublicIdentity] = useState(null);
  const [identityDetails, setIdentityDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableActors, setAvailableActors] = useState([]);

  // Per-instance monotonic counters — correctly scoped to this provider instance.
  const resolveVersionRef = useRef(0);
  const switchVersionRef = useRef(0);
  const explicitSwitchAbortedRef = useRef(false);

  const [switching, setSwitching] = useState(false);
  const switchingRef = useRef(false);

  const engineQuery = useIdentityEngineQuery(user?.id, { enabled: false });

  function commitIdentity(nextDetails) {
    const nextPublic = toPublicIdentity(nextDetails);
    if (nextDetails && !nextPublic) {
      captureVcsmError({
        feature: 'identity',
        module: 'identityContext',
        behavior_id: 'behavior.identity.public_identity',
        severity: 'error',
        message: 'toPublicIdentity returned null for non-null identityDetails — actorId or kind missing from hydrated object',
        operation: 'commitIdentity',
        is_handled: false,
        context: {
          hasActorId: !!nextDetails?.actorId,
          hasKind: !!nextDetails?.kind,
          identityKind: nextDetails?.kind ?? null,
        },
      });
    }
    setIdentityDetails(nextDetails ?? null);
    setPublicIdentity(nextPublic);

    if (nextDetails?.actorId) {
      try {
        useActorStore.getState().upsertActors([{
          actor_id: nextDetails.actorId,
          kind: nextDetails.kind ?? null,
          display_name: nextDetails.displayName ?? null,
          username: nextDetails.username ?? null,
          photo_url: nextDetails.avatar ?? null,
          banner_url: nextDetails.banner ?? null,
          ...(nextDetails.kind === 'vport' && {
            vport_name: nextDetails.displayName ?? null,
            vport_slug: nextDetails.username ?? null,
            vport_avatar_url: nextDetails.avatar ?? null,
          }),
        }])
      } catch (_) { /* best-effort actor-store sync — non-fatal */ }
      useIdentitySelectionStore.getState().setActiveActor({
        actorId: nextDetails.actorId,
        actorKind: nextDetails.kind ?? null,
        actorLinkId: nextDetails._engineMeta?.actorLinkId ?? null,
      })
    } else {
      useIdentitySelectionStore.getState().clearActiveActor()
    }
  }

  // Display-only identity patch. Replaces the former ungoverned setIdentity
  // public surface. Accepts ONLY display fields — actorId / kind / realmId /
  // actorLinkId can never be mutated here. Actor identity changes must go
  // exclusively through switchActor() (lock + version guard + rollback).
  function patchIdentityDisplayFields(fields = {}) {
    const allowed = {};
    if (Object.prototype.hasOwnProperty.call(fields, "avatar")) allowed.avatar = fields.avatar;
    if (Object.prototype.hasOwnProperty.call(fields, "banner")) allowed.banner = fields.banner;
    if (Object.prototype.hasOwnProperty.call(fields, "displayName")) allowed.displayName = fields.displayName;
    if (Object.prototype.hasOwnProperty.call(fields, "bio")) allowed.bio = fields.bio;

    if (Object.keys(allowed).length === 0) return;
    if (!identityDetails) return;

    commitIdentity({ ...identityDetails, ...allowed });
  }

  async function switchActor(actorId, _dbgEntryPoint) {
    if (!actorId) return { success: false, code: "NO_ACTOR_ID", requestedActorId: null, availableActorIds: [] };

    if (switchingRef.current) {
      return {
        success: false,
        code: "SWITCH_ABORT_IN_PROGRESS",
        reason: "Actor switch already in progress.",
        requestedActorId: actorId,
        availableActorIds: [],
      };
    }

    switchingRef.current = true;
    setSwitching(true);

    try {
      const mySwitchVersion = ++switchVersionRef.current;

      let ctx = engineQuery.data ?? getIdentityEngineContext(identityDetails);

      const result = await switchActorController({
        actorId,
        ctx,
        currentActorId: identity?.actorId ?? null,
        entryPoint: _dbgEntryPoint ?? "unknown",
      });

      if (result.linkNotFound) {
        explicitSwitchAbortedRef.current = true;
      }

      if (result.success && result.nextIdentity) {
        if (mySwitchVersion !== switchVersionRef.current) {
          return { success: false, code: "SWITCH_ABORT_STALE", requestedActorId: actorId, availableActorIds: [] };
        }
        explicitSwitchAbortedRef.current = false;
        saveIdentity(actorId, user?.id);
        commitIdentity(result.nextIdentity);
        invalidateIdentityEngineQuery(queryClient, user?.id);
        purgeChatMessageCache();
        purgeNotificationCache();
        // Reset bootstrap so unread badges read placeholder 0 for the one render
        // before useBootstrapHydration re-points hydratedForActorId at the new
        // actor — prevents a one-frame flash of the previous actor's chat count.
        invalidateBootstrap();
      }

      return {
        success: result.success,
        code: result.code,
        requestedActorId: actorId,
        availableActorIds: result.availableActorIds ?? [],
      };
    } finally {
      switchingRef.current = false;
      setSwitching(false);
    }
  }

  // Immediately clear stale identity when auth user changes (includes logout).
  useEffect(() => {
    debugLoginEvent("IDENTITY_CLEAR_ON_USER_CHANGE", {
      phase: "identity", status: "info",
      message: user?.id ? `User changed to ${user.id.slice(0, 8)}` : "User became null",
      payload: { newUserId: user?.id ?? null, previousActorId: identity?.actorId ?? null },
    });
    commitIdentity(null);
    setLoading(true);
    purgeChatMessageCache();
    purgeNotificationCache();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Main identity resolution — extracted to hook for size compliance.
  useIdentityResolutionEffect({
    user,
    authLoading,
    logout,
    identity,
    commitIdentity,
    setLoading,
    setAvailableActors,
    queryClient,
    resolveVersionRef,
    explicitSwitchAbortedRef,
  });

  // Global feed viewer sync
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    debugFeedViewer({ user, identity });
  }, [identity, user]);

  async function refreshAvailableActors() {
    try {
      invalidateIdentityResultCache();
      await invalidateIdentityEngineQuery(queryClient, user?.id);
      const ctx = await engineQuery.refetch().then((r) => r.data);
      if (ctx?.availableActors?.length) {
        setAvailableActors(ctx.availableActors);
      }
    } catch (_) { /* best-effort actor refresh — non-fatal */ }
  }

  const blockedVport = isBlockedVportIdentity(identityDetails);

  // Systemic guard: auto-switch away from a blocked VPORT identity.
  useEffect(() => {
    if (!blockedVport) return;
    const citizenActor = availableActors.find((a) => a.actorKind === "user");
    if (!citizenActor?.actorId) return;
    switchActor(citizenActor.actorId, "blocked_vport_auto_switch").catch(() => {});
  }, [blockedVport]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <IdentityDetailsContext.Provider value={identityDetails}>
      <IdentityContext.Provider
        value={{
          identity,
          loading,
          identityLoading: loading,
          switching,
          patchIdentityDisplayFields,
          switchActor,
          availableActors,
          refreshAvailableActors,
          blockedVport,
        }}
      >
        {children}
      </IdentityContext.Provider>
    </IdentityDetailsContext.Provider>
  );
}

export function useIdentity() {
  return useContext(IdentityContext);
}

export function useIdentityDetailsDeprecated() {
  return useContext(IdentityDetailsContext);
}

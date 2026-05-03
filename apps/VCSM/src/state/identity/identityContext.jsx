import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/providers/AuthProvider";
import { saveIdentity } from "@/state/identity/identityStorage";
import { invalidateIdentityResultCache } from "@identity";
import { purgeChatMessageCache, purgeNotificationCache } from "@/bootstrap/bootstrap.invalidate";
import { debugLoginEvent } from "@debuggers/identity";
import { debugFeedViewer } from "@debuggers/feed";
import {
  useIdentityEngineQuery,
  invalidateIdentityEngineQuery,
} from "@/state/identity/queries/identityEngineQuery";
import { switchActorController } from "@/state/identity/controller/switchActor.controller";
import {
  getIdentityEngineContext,
  isBlockedVportIdentity,
  toPublicIdentity,
} from "@/state/identity/identity.model";
import { useIdentityResolutionEffect } from "@/state/identity/useIdentityResolutionEffect.hook";
import { useActorStore } from "@hydration";

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

  const engineQuery = useIdentityEngineQuery(user?.id, { enabled: false });

  function commitIdentity(nextDetails) {
    setIdentityDetails(nextDetails ?? null);
    setPublicIdentity(toPublicIdentity(nextDetails));

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
      } catch (_) {}
    }
  }

  function setIdentityCompat(next) {
    const nextDetails = typeof next === "function" ? next(identityDetails) : next;
    commitIdentity(nextDetails);
  }

  async function switchActor(actorId, _dbgEntryPoint) {
    if (!actorId) return { success: false, code: "NO_ACTOR_ID", requestedActorId: null, availableActorIds: [] };
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
    }

    return {
      success: result.success,
      code: result.code,
      requestedActorId: actorId,
      availableActorIds: result.availableActorIds ?? [],
    };
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
    } catch (_) {}
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
          setIdentity: setIdentityCompat,
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

export function useIdentityDisplayDeprecated() {
  const details = useIdentityDetailsDeprecated();

  return {
    displayName: details?.displayName ?? null,
    username: details?.username ?? null,
    avatar: details?.avatar ?? details?.avatarUrl ?? details?.photoUrl ?? null,
    banner: details?.banner ?? details?.bannerUrl ?? null,
    vportType: details?.vportType ?? null,
    isActive: details?.isActive ?? null,
    isDeleted: details?.isDeleted ?? null,
    isVoid: details?.isVoid ?? null,
  };
}

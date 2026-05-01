import { useEffect } from "react";
import {
  loadDefaultIdentityForUser,
  DELETED_ACCOUNT_SENTINEL,
} from "@/state/identity/identity.controller";
import {
  bootstrapIdentitySelfHeal,
  findSelfHealActorForUser,
} from "@/state/identity/identitySelfHeal.controller";
import { runFinalizeSelfHeal } from "@/state/identity/identityResolutionSelfHeal.helper";
import { loadIdentity } from "@/state/identity/identityStorage";
import { identityEngineQueryKey } from "@/state/identity/queries/identityEngineQuery";
import { debugLoginEvent, debugLoginError, debugLoginIdentitySnapshot } from "@debuggers/identity";
import { checkRefreshRestore, clearLastSwitchTarget } from "@debuggers/actor-switch";

/**
 * Runs the identity resolution effect for IdentityProvider.
 *
 * Accepts mutable refs for resolve version and explicit-switch-abort flag so
 * the effect and switchActor (which stays in the provider) share the same
 * per-instance counters without module-level mutable state.
 */
export function useIdentityResolutionEffect({
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
}) {
  useEffect(() => {
    let cancelled = false;
    const myVersion = ++resolveVersionRef.current;

    async function run() {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user?.id) {
        debugLoginEvent("NO_USER", { phase: "auth", status: "info", message: "No authenticated user" });
        commitIdentity(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        debugLoginEvent("IDENTITY_PROVIDER_TRIGGERED", { phase: "identity", message: `userId=${user.id}` });

        const t0 = performance.now();
        let nextIdentity = await loadDefaultIdentityForUser({
          userId: user.id,
          savedActorId: loadIdentity(user.id),
          resolveAttempt: "initial",
        });
        const resolveMs = Math.round(performance.now() - t0);

        if (nextIdentity === DELETED_ACCOUNT_SENTINEL) {
          debugLoginEvent("IDENTITY_DELETED_ACCOUNT", {
            phase: "identity", status: "warn",
            message: "Account is soft-deleted — signing out",
            payload: { userId: user.id },
          });
          commitIdentity(null);
          setLoading(false);
          await logout({ accountDeleted: true });
          return;
        }

        if (nextIdentity) {
          debugLoginEvent("IDENTITY_RESOLVED", {
            phase: "identity", status: "success",
            message: `Resolved in ${resolveMs}ms`,
            payload: { actorId: nextIdentity.actorId, kind: nextIdentity.kind },
          });
        } else {
          debugLoginEvent("IDENTITY_RESOLVE_EMPTY", { phase: "identity", status: "warn", message: "No platform identity — trying self-heal" });
        }

        let selfHealUsed = false;

        if (!nextIdentity) {
          const vcActor = await findSelfHealActorForUser(user.id);

          if (vcActor?.actorId) {
            debugLoginEvent("SELF_HEAL_START", {
              phase: "heal",
              payload: { userId: user.id, actorId: vcActor.actorId, reason: "no platform rows from engine" },
            });

            try {
              const healResult = await bootstrapIdentitySelfHeal({
                userId: user.id,
                actorId: vcActor.actorId,
              });
              selfHealUsed = true;

              debugLoginEvent("SELF_HEAL_SUCCESS", {
                phase: "heal", status: "success",
                payload: { userId: user.id, actorId: vcActor.actorId, userAppAccountId: healResult?.userAppAccountId ?? null },
              });
            } catch (healErr) {
              debugLoginError("SELF_HEAL_ERROR", healErr, {
                phase: "heal",
                payload: { userId: user.id },
              });
            }

            nextIdentity = await loadDefaultIdentityForUser({
              userId: user.id,
              savedActorId: loadIdentity(user.id),
              resolveAttempt: "retry_after_self_heal",
            });

            await runFinalizeSelfHeal({ nextIdentity });
          }
        }

        const isStale = cancelled || myVersion !== resolveVersionRef.current;

        if (isStale) {
          debugLoginEvent("IDENTITY_COMMIT_REJECTED_STALE", {
            phase: "identity", status: "warn",
            message: `Resolve v${myVersion} rejected (current v${resolveVersionRef.current}, cancelled=${cancelled})`,
            payload: { myVersion, currentVersion: resolveVersionRef.current, cancelled, actorId: nextIdentity?.actorId ?? null },
          });
          return;
        }

        const _meta = nextIdentity?._engineMeta ?? {};
        if (import.meta.env.DEV) {
          console.log("[IdentityApp] COMMIT_ATTEMPT", {
            sessionUserId: user.id,
            nextIdentityUserId: _meta.userId ?? null,
            nextActorId: nextIdentity?.actorId ?? null,
            nextActorKind: nextIdentity?.kind ?? null,
            nextUserAppAccountId: _meta.userAppAccountId ?? null,
            nextActorLinkId: _meta.actorLinkId ?? null,
            source: selfHealUsed ? "self_heal" : (_meta.engineResolved ? "engine" : "hydration"),
            resolveVersion: myVersion,
          });
        }

        if (nextIdentity) {
          const identityUserId = nextIdentity._engineMeta?.userId ?? null;
          if (identityUserId && identityUserId !== user.id) {
            debugLoginEvent("IDENTITY_OWNERSHIP_MISMATCH", {
              phase: "identity", status: "error",
              message: `Rejecting identity: belongs to ${identityUserId}, session is ${user.id}`,
              payload: { identityUserId, sessionUserId: user.id, actorId: nextIdentity.actorId },
            });
            commitIdentity(null);
            setLoading(false);
            return;
          }

          const meta = nextIdentity._engineMeta ?? {};

          debugLoginIdentitySnapshot(nextIdentity, {
            userId: user.id,
            userAppAccountId: meta.userAppAccountId ?? null,
            actorLinkId: meta.actorLinkId ?? null,
            actorSource: meta.actorSource ?? "vc",
            selfHealUsed,
            engineResolved: meta.engineResolved ?? false,
          });

          debugLoginEvent("LOGIN_FLOW_DONE", {
            phase: "identity", status: "success",
            message: `Identity ready${selfHealUsed ? " (self-healed)" : ""}`,
            payload: {
              actorId: nextIdentity.actorId,
              kind: nextIdentity.kind,
              userAppAccountId: meta.userAppAccountId ?? null,
              actorLinkId: meta.actorLinkId ?? null,
              actorSource: meta.actorSource ?? "vc",
              selfHealUsed,
              engineResolved: meta.engineResolved ?? false,
            },
          });
        }

        debugLoginEvent("IDENTITY_COMMIT_SUCCESS", {
          phase: "identity", status: "success",
          message: nextIdentity ? `Committed actor ${nextIdentity.actorId?.slice(0, 8)}` : "Committed null identity",
          payload: {
            actorId: nextIdentity?.actorId ?? null,
            kind: nextIdentity?.kind ?? null,
            sessionUserId: user.id,
            resolveVersion: myVersion,
            selfHealUsed,
          },
        });

        if (nextIdentity?._engineMeta?.availableActors?.length) {
          setAvailableActors(nextIdentity._engineMeta.availableActors);
        }

        // Fallback guard: if switchActor already aborted because the requested
        // actor was not in the link table, do NOT let this background resolve
        // overwrite the current actor with the platform-preference fallback.
        if (explicitSwitchAbortedRef.current && identity !== null && nextIdentity?.actorId !== identity?.actorId) {
          debugLoginEvent("BLOCKED_FALLBACK_AFTER_EXPLICIT_FAILURE", {
            phase: "identity", status: "warn",
            message: `Background load blocked: switch aborted, current actor ${identity.actorId?.slice(0, 8)} preserved`,
            payload: {
              blockedActorId: nextIdentity?.actorId ?? null,
              preservedActorId: identity?.actorId ?? null,
            },
          });
          setLoading(false);
          return;
        }

        commitIdentity(nextIdentity);
        setLoading(false);

        // Seed React Query engine cache from the resolved identity so switchActor
        // can immediately read ctx without firing a redundant resolveAuthenticatedContext call.
        if (nextIdentity?._engineMeta?.engineResolved) {
          const meta = nextIdentity._engineMeta;
          queryClient.setQueryData(identityEngineQueryKey(user.id), {
            userId: meta.userId ?? null,
            userAppAccountId: meta.userAppAccountId,
            availableActors: meta.availableActors ?? [],
            activeActor: {
              actorId:     nextIdentity.actorId,
              id:          meta.actorLinkId,
              actorSource: meta.actorSource ?? "vc",
            },
          });
        }

        if (import.meta.env.DEV && nextIdentity?.actorId) {
          const restored = checkRefreshRestore(nextIdentity.actorId);
          if (restored !== null) {
            debugLoginEvent(restored ? "SWITCH_REFRESH_RESTORE_SUCCESS" : "SWITCH_REFRESH_RESTORE_MISMATCH", {
              phase: "identity",
              status: restored ? "success" : "warn",
              message: restored
                ? "Refresh restored same actor from platform preference"
                : "Refresh restored DIFFERENT actor than last switch target",
              payload: { restoredActorId: nextIdentity.actorId },
            });
            clearLastSwitchTarget();
          }
        }
      } catch (error) {
        console.error("[Identity] failed to hydrate default identity", error);
        if (!cancelled) {
          commitIdentity(null);
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

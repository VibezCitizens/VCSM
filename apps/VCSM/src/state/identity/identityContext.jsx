import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  loadDefaultIdentityForUser,
  loadIdentityForActorId,
  DELETED_ACCOUNT_SENTINEL,
} from "@/state/identity/identity.controller";
import { loadIdentity, saveIdentity } from "@/state/identity/identityStorage";
import { ensureVcsmPlatformBootstrap } from "@/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js";
import {
  resolveAuthenticatedContext,
  invalidateIdentityResultCache,
  switchActiveActor as engineSwitchActiveActor,
  finalizeAccountState,
} from "@identity";
import { debugLoginEvent, debugLoginError, debugLoginIdentitySnapshot } from "@debuggers/identity";
import { createSwitchDebugSession, checkRefreshRestore, clearLastSwitchTarget } from "@debuggers/actor-switch";
import { debugFeedViewer } from "@debuggers/feed";

const IdentityContext = createContext(null);

// Monotonic version counter — only the newest resolve attempt may commit.
let _resolveVersion = 0;
// Monotonic switch counter — only the newest switchActor attempt may commit.
let _switchVersion = 0;
// Set to true when switchActor terminally aborts (link not found).
// Prevents the background initial-load effect from overwriting the current
// actor with a platform-preference fallback that belongs to a different vport.
let _explicitSwitchAborted = false;

export function IdentityProvider({ children }) {
  const { user, loading: authLoading, logout } = useAuth();
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableActors, setAvailableActors] = useState([]);

  async function switchActor(actorId, _dbgEntryPoint) {
    if (!actorId) return { success: false, code: 'NO_ACTOR_ID', requestedActorId: null, availableActorIds: [] };
    const mySwitchVersion = ++_switchVersion;

    const dbg = import.meta.env.DEV
      ? createSwitchDebugSession({
          entryPoint: _dbgEntryPoint ?? 'unknown',
          requestedActorId: actorId,
          previousActorId: identity?.actorId ?? null,
        })
      : { event() {}, error() {}, finish() {} };

    dbg.event('SWITCH_START', { status: 'start', message: `Switch to ${actorId.slice(0, 8)}` });

    // Snapshot accumulators
    let engineContextResolved = false;
    let linkMatched = false;
    let platformWriteAttempted = false;
    let platformWriteSucceeded = false;
    let hydrationSucceeded = false;
    let stateUpdated = false;
    let localStorageWritten = false;
    let userAppAccountId = null;
    let actorLinkId = null;
    let actorKind = null;
    let actorSource = null;

    try {
      // 1. Resolve engine context (REQUIRED — abort if fails)
      dbg.event('ENGINE_CONTEXT_RESOLVE_START', { status: 'start' });

      let ctx;
      try {
        ctx = await resolveAuthenticatedContext({
          appKey: "vcsm",
          skipLoginRecord: true,
        });
      } catch (resolveErr) {
        dbg.error('SWITCH_ABORT_ENGINE_RESOLVE_FAILED', resolveErr, {
          message: 'Engine context resolution failed — switch aborted',
        });
        dbg.event('SWITCH_DONE', { status: 'error', message: 'Aborted: engine resolve failed' });
        return { success: false, code: 'SWITCH_ABORT_ENGINE_RESOLVE_FAILED', requestedActorId: actorId, availableActorIds: [] };
      }

      if (!ctx?.userAppAccountId || !ctx?.availableActors?.length) {
        dbg.event('SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT', {
          status: 'error',
          message: 'No account or actors — switch aborted',
          payload: { hasAccount: !!ctx?.userAppAccountId, actorCount: ctx?.availableActors?.length ?? 0 },
        });
        dbg.event('SWITCH_DONE', { status: 'error', message: 'Aborted: missing account context' });
        return { success: false, code: 'SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT', requestedActorId: actorId, availableActorIds: [] };
      }

      engineContextResolved = true;
      userAppAccountId = ctx.userAppAccountId;
      setAvailableActors(ctx.availableActors ?? []);
      dbg.event('ENGINE_CONTEXT_RESOLVE_SUCCESS', {
        status: 'success',
        payload: {
          userAppAccountId: ctx.userAppAccountId,
          activeActorBefore: ctx.activeActor?.actorId ?? null,
          availableCount: ctx.availableActors.length,
          availableActors: ctx.availableActors.map((a) => ({
            actorId: a.actorId,
            actorKind: a.actorKind,
            isSwitchable: a.isSwitchable,
            isPrimary: a.isPrimary,
          })),
        },
      });

      // 2. Match target actor link (REQUIRED — abort if not found)
      dbg.event('SWITCH_LINK_MATCH_START', { status: 'start', payload: { target: actorId } });
      const link = ctx.availableActors.find((a) => a.actorId === actorId);

      if (!link?.id) {
        const availableActorIds = ctx.availableActors.map((a) => a.actorId);
        _explicitSwitchAborted = true;
        dbg.event('SWITCH_ABORT_LINK_NOT_FOUND', {
          status: 'error',
          message: `No link found for actorId ${actorId.slice(0, 8)} — switch aborted (TERMINAL)`,
          payload: { availableIds: availableActorIds },
        });
        dbg.event('SWITCH_TERMINAL_ABORT', {
          status: 'error',
          message: 'Identity state unchanged. Background load blocked from overwriting.',
        });
        dbg.event('SWITCH_DONE', { status: 'error', message: 'Aborted: link not found' });
        dbg.finish({
          appKey: 'vcsm',
          requestedActorId: actorId,
          previousActorId: identity?.actorId ?? null,
          finalActorId: identity?.actorId ?? null,
          userAppAccountId,
          actorLinkId: null,
          actorSource: 'vc',
          actorKind: null,
          entryPoint: _dbgEntryPoint ?? 'unknown',
          engineContextResolved,
          linkMatched: false,
          platformWriteAttempted: false,
          platformWriteSucceeded: false,
          hydrationStarted: false,
          hydrationSucceeded: false,
          stateUpdated: false,
          localStorageWritten: false,
          localStorageRole: 'cache_only',
          refreshRestoredSameActor: null,
          switchVerdict: null,
        });
        return { success: false, code: 'SWITCH_ABORT_LINK_NOT_FOUND', requestedActorId: actorId, availableActorIds };
      }

      linkMatched = true;
      actorLinkId = link.id;
      actorKind = link.actorKind ?? null;
      actorSource = link.actorSource ?? 'vc';
      dbg.event('SWITCH_LINK_MATCH_SUCCESS', {
        status: 'success',
        payload: {
          actorLinkId: link.id,
          actorKind: link.actorKind,
          actorSource: link.actorSource,
          isSwitchable: link.isSwitchable,
          status: link.status,
        },
      });

      // 3. Write platform preference (REQUIRED — abort if fails)
      dbg.event('SWITCH_PLATFORM_WRITE_START', { status: 'start' });
      platformWriteAttempted = true;

      try {
        await engineSwitchActiveActor({
          userAppAccountId: ctx.userAppAccountId,
          actorLinkId: link.id,
        });
      } catch (writeErr) {
        dbg.error('SWITCH_ABORT_PLATFORM_WRITE_FAILED', writeErr, {
          message: 'Platform preference write failed — switch aborted',
        });
        dbg.event('SWITCH_DONE', { status: 'error', message: 'Aborted: platform write failed' });
        return { success: false, code: 'SWITCH_ABORT_PLATFORM_WRITE_FAILED', requestedActorId: actorId, availableActorIds: ctx.availableActors.map((a) => a.actorId) };
      }

      platformWriteSucceeded = true;
      dbg.event('SWITCH_PLATFORM_WRITE_SUCCESS', {
        status: 'success',
        message: 'platform.user_app_preferences written',
      });
      dbg.event('SWITCH_ENGINE_EVENT_EMITTED', { status: 'info', message: 'ACTOR_SWITCHED event' });

      // 4. Hydrate with VCSM domain data (only after platform write succeeded)
      dbg.event('SWITCH_HYDRATION_START', { status: 'start', payload: { actorId } });
      const nextIdentity = await loadIdentityForActorId(actorId);

      if (nextIdentity) {
        // Version guard: reject if a newer switch was started while we were resolving
        if (mySwitchVersion !== _switchVersion) {
          dbg.event('SWITCH_ABORT_STALE', {
            status: 'warn',
            message: `Switch v${mySwitchVersion} rejected (current v${_switchVersion})`,
            payload: { mySwitchVersion, currentVersion: _switchVersion, actorId },
          });
          dbg.event('SWITCH_DONE', { status: 'warn', message: 'Aborted: stale switch' });
          return { success: false, code: 'SWITCH_ABORT_STALE', requestedActorId: actorId, availableActorIds: [] };
        }

        hydrationSucceeded = true;
        actorKind = nextIdentity.kind ?? actorKind;
        dbg.event('SWITCH_HYDRATION_SUCCESS', {
          status: 'success',
          payload: {
            actorId: nextIdentity.actorId,
            kind: nextIdentity.kind,
            displayName: nextIdentity.displayName,
            username: nextIdentity.username,
            realmId: nextIdentity.realmId,
          },
        });

        saveIdentity(actorId, user?.id);
        localStorageWritten = true;
        dbg.event('SWITCH_LOCALSTORAGE_WRITE', { status: 'info', message: 'cache_only', payload: { actorId } });

        setIdentity(nextIdentity);
        stateUpdated = true;
        dbg.event('SWITCH_STATE_SET', { status: 'success', message: 'React state updated' });
      } else {
        dbg.event('SWITCH_HYDRATION_ERROR', { status: 'error', message: 'Hydration returned null' });
      }

      dbg.event('SWITCH_DONE', { status: stateUpdated ? 'success' : 'error' });
      // Clear abort flag on successful switch
      if (stateUpdated) _explicitSwitchAborted = false;

    } catch (error) {
      dbg.error('SWITCH_DONE', error, { message: 'Switch failed' });
      console.error("[Identity] failed to switch actor", error);
    }

    // Finalize snapshot
    dbg.finish({
      appKey: 'vcsm',
      requestedActorId: actorId,
      previousActorId: identity?.actorId ?? null,
      finalActorId: stateUpdated ? actorId : (identity?.actorId ?? null),
      userAppAccountId,
      actorLinkId,
      actorSource: actorSource ?? 'vc',
      actorKind,
      entryPoint: _dbgEntryPoint ?? 'unknown',
      engineContextResolved,
      linkMatched,
      platformWriteAttempted,
      platformWriteSucceeded,
      hydrationStarted: true,
      hydrationSucceeded,
      stateUpdated,
      localStorageWritten,
      localStorageRole: 'cache_only',
      refreshRestoredSameActor: null, // checked after refresh
      switchVerdict: null, // computed by store
    });

    return {
      success: stateUpdated,
      code: stateUpdated ? 'SWITCH_SUCCESS' : 'SWITCH_STATE_UNCHANGED',
      requestedActorId: actorId,
      availableActorIds: [],
    };
  }

  // Immediately clear stale identity when auth user changes.
  // This prevents the previous user's identity from being visible
  // during the async resolution window after login.
  useEffect(() => {
    debugLoginEvent('IDENTITY_CLEAR_ON_USER_CHANGE', {
      phase: 'identity', status: 'info',
      message: user?.id ? `User changed to ${user.id.slice(0, 8)}` : 'User became null',
      payload: { newUserId: user?.id ?? null, previousActorId: identity?.actorId ?? null },
    });
    setIdentity(null);
    setLoading(true);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    // Capture version at effect start — only this version may commit
    const myVersion = ++_resolveVersion;

    async function run() {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user?.id) {
        debugLoginEvent('NO_USER', { phase: 'auth', status: 'info', message: 'No authenticated user' })
        setIdentity(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        debugLoginEvent('IDENTITY_PROVIDER_TRIGGERED', { phase: 'identity', message: `userId=${user.id}` })

        const t0 = performance.now()
        let nextIdentity = await loadDefaultIdentityForUser({
          userId: user.id,
          savedActorId: loadIdentity(user.id),
          resolveAttempt: 'initial',
        });
        const resolveMs = Math.round(performance.now() - t0)

        // Deleted account gate: actor exists but is soft-deleted — force sign out.
        if (nextIdentity === DELETED_ACCOUNT_SENTINEL) {
          debugLoginEvent('IDENTITY_DELETED_ACCOUNT', {
            phase: 'identity', status: 'warn',
            message: 'Account is soft-deleted — signing out',
            payload: { userId: user.id },
          })
          setIdentity(null)
          setLoading(false)
          await logout({ accountDeleted: true })
          return
        }

        if (nextIdentity) {
          debugLoginEvent('IDENTITY_RESOLVED', {
            phase: 'identity', status: 'success',
            message: `Resolved in ${resolveMs}ms`,
            payload: { actorId: nextIdentity.actorId, kind: nextIdentity.kind },
          })
        } else {
          debugLoginEvent('IDENTITY_RESOLVE_EMPTY', { phase: 'identity', status: 'warn', message: 'No platform identity — trying self-heal' })
        }

        // Self-heal: if engine found no platform rows, provision then retry
        let selfHealUsed = false;

        if (!nextIdentity) {
          const { supabase } = await import("@/services/supabase/supabaseClient");
          const { data: vcActor } = await supabase
            .schema("vc")
            .from("actors")
            .select("id")
            .eq("profile_id", user.id)
            .eq("kind", "user")
            .maybeSingle();

          if (vcActor?.id) {
            debugLoginEvent('SELF_HEAL_START', {
              phase: 'heal',
              payload: { userId: user.id, actorId: vcActor.id, reason: 'no platform rows from engine' },
            })

            try {
              const healResult = await ensureVcsmPlatformBootstrap({
                userId: user.id,
                actorId: vcActor.id,
              });
              selfHealUsed = true;

              debugLoginEvent('SELF_HEAL_SUCCESS', {
                phase: 'heal', status: 'success',
                payload: { userId: user.id, actorId: vcActor.id, userAppAccountId: healResult?.userAppAccountId ?? null },
              })
            } catch (healErr) {
              debugLoginError('SELF_HEAL_ERROR', healErr, {
                phase: 'heal',
                payload: { userId: user.id },
              })
            }

            nextIdentity = await loadDefaultIdentityForUser({
              userId: user.id,
              savedActorId: loadIdentity(user.id),
              resolveAttempt: 'retry_after_self_heal',
            });

            // Finalize platform state: persist the chosen actor so future
            // resolves are deterministic (no more null-preference fallback).
            if (nextIdentity?._engineMeta?.engineResolved) {
              const meta = nextIdentity._engineMeta;
              if (meta.userAppAccountId && meta.actorLinkId) {
                try {
                  await engineSwitchActiveActor({
                    userAppAccountId: meta.userAppAccountId,
                    actorLinkId: meta.actorLinkId,
                  });
                  debugLoginEvent('SELF_HEAL_PREFS_WRITE', {
                    phase: 'heal', status: 'success',
                    message: 'Persisted active actor preference after self-heal',
                    payload: {
                      userAppAccountId: meta.userAppAccountId,
                      actorLinkId: meta.actorLinkId,
                      actorId: nextIdentity.actorId,
                    },
                  });

                  // Finalize account state (onboarding complete, login timestamps, etc.)
                  try {
                    await finalizeAccountState({
                      userAppAccountId: meta.userAppAccountId,
                      actorLinkId: meta.actorLinkId,
                    });
                    debugLoginEvent('SELF_HEAL_STATE_FINALIZE', {
                      phase: 'heal', status: 'success',
                      message: 'Account state finalized',
                      payload: { userAppAccountId: meta.userAppAccountId },
                    });
                  } catch (stateErr) {
                    debugLoginEvent('SELF_HEAL_STATE_FINALIZE_FAILED', {
                      phase: 'heal', status: 'warn',
                      message: 'Failed to finalize state (non-fatal)',
                      payload: { error: stateErr?.message },
                    });
                  }
                } catch (prefErr) {
                  debugLoginEvent('SELF_HEAL_PREFS_WRITE_FAILED', {
                    phase: 'heal', status: 'warn',
                    message: 'Failed to persist preference after self-heal (non-fatal)',
                    payload: { error: prefErr?.message },
                  });
                }
              }
            }
          }
        }

        // OWNERSHIP + VERSION GUARD: only commit if this is still the newest
        // resolve attempt AND identity belongs to the current auth user.
        const isStale = cancelled || myVersion !== _resolveVersion;

        if (isStale) {
          debugLoginEvent('IDENTITY_COMMIT_REJECTED_STALE', {
            phase: 'identity', status: 'warn',
            message: `Resolve v${myVersion} rejected (current v${_resolveVersion}, cancelled=${cancelled})`,
            payload: { myVersion, currentVersion: _resolveVersion, cancelled, actorId: nextIdentity?.actorId ?? null },
          });
          return;
        }

        if (true) { // (was: if (!isStale))
          // COMMIT_ATTEMPT — log what we're about to commit
          const _meta = nextIdentity?._engineMeta ?? {};
          if (import.meta.env.DEV) {
            console.log('[IdentityApp] COMMIT_ATTEMPT', {
              sessionUserId: user.id,
              nextIdentityUserId: _meta.userId ?? null,
              nextActorId: nextIdentity?.actorId ?? null,
              nextActorKind: nextIdentity?.kind ?? null,
              nextUserAppAccountId: _meta.userAppAccountId ?? null,
              nextActorLinkId: _meta.actorLinkId ?? null,
              source: selfHealUsed ? 'self_heal' : (_meta.engineResolved ? 'engine' : 'hydration'),
              resolveVersion: myVersion,
            });
          }

          if (nextIdentity) {
            // Ownership validation: the resolved identity must belong to the
            // current session user. If it doesn't, reject it entirely.
            const identityUserId = nextIdentity._engineMeta?.userId ?? null;
            if (identityUserId && identityUserId !== user.id) {
              debugLoginEvent('IDENTITY_OWNERSHIP_MISMATCH', {
                phase: 'identity', status: 'error',
                message: `Rejecting identity: belongs to ${identityUserId}, session is ${user.id}`,
                payload: { identityUserId, sessionUserId: user.id, actorId: nextIdentity.actorId },
              });
              setIdentity(null);
              setLoading(false);
              return;
            }

            const meta = nextIdentity._engineMeta ?? {}

            debugLoginIdentitySnapshot(nextIdentity, {
              userId: user.id,
              userAppAccountId: meta.userAppAccountId ?? null,
              actorLinkId: meta.actorLinkId ?? null,
              actorSource: meta.actorSource ?? 'vc',
              selfHealUsed,
              engineResolved: meta.engineResolved ?? false,
            })

            debugLoginEvent('LOGIN_FLOW_DONE', {
              phase: 'identity', status: 'success',
              message: `Identity ready${selfHealUsed ? ' (self-healed)' : ''}`,
              payload: {
                actorId: nextIdentity.actorId,
                kind: nextIdentity.kind,
                userAppAccountId: meta.userAppAccountId ?? null,
                actorLinkId: meta.actorLinkId ?? null,
                actorSource: meta.actorSource ?? 'vc',
                selfHealUsed,
                engineResolved: meta.engineResolved ?? false,
              },
            })
          }
          debugLoginEvent('IDENTITY_COMMIT_SUCCESS', {
            phase: 'identity', status: 'success',
            message: nextIdentity ? `Committed actor ${nextIdentity.actorId?.slice(0, 8)}` : 'Committed null identity',
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
          // The user clicked a specific vport and the switch failed — stay put.
          if (_explicitSwitchAborted && identity !== null && nextIdentity?.actorId !== identity?.actorId) {
            debugLoginEvent('BLOCKED_FALLBACK_AFTER_EXPLICIT_FAILURE', {
              phase: 'identity', status: 'warn',
              message: `Background load blocked: switch aborted, current actor ${identity.actorId?.slice(0, 8)} preserved`,
              payload: {
                blockedActorId: nextIdentity?.actorId ?? null,
                preservedActorId: identity?.actorId ?? null,
              },
            });
            setLoading(false);
            return;
          }

          setIdentity(nextIdentity);
          setLoading(false);

          // Refresh restore check for actor switch debugger
          if (import.meta.env.DEV && nextIdentity?.actorId) {
            const restored = checkRefreshRestore(nextIdentity.actorId);
            if (restored !== null) {
              debugLoginEvent(restored ? 'SWITCH_REFRESH_RESTORE_SUCCESS' : 'SWITCH_REFRESH_RESTORE_MISMATCH', {
                phase: 'identity',
                status: restored ? 'success' : 'warn',
                message: restored
                  ? 'Refresh restored same actor from platform preference'
                  : 'Refresh restored DIFFERENT actor than last switch target',
                payload: { restoredActorId: nextIdentity.actorId },
              });
              clearLastSwitchTarget();
            }
          }
        }
      } catch (error) {
        console.error("[Identity] failed to hydrate default identity", error);
        if (!cancelled) {
          setIdentity(null);
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  // Global feed viewer sync — fires on every identity commit (login, switch, clear)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    debugFeedViewer({ user, identity });
  }, [identity, user]);

  async function refreshAvailableActors() {
    try {
      // Bust the 120s TTL cache before re-fetching. Without this, calls made
      // shortly after vport creation return the stale cached actor list and the
      // new vport's platform link is invisible until the TTL expires.
      invalidateIdentityResultCache();
      const ctx = await resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true });
      if (ctx?.availableActors?.length) {
        setAvailableActors(ctx.availableActors);
      }
    } catch (_) {}
  }

  const blockedVport =
    identity?.kind === 'vport' &&
    (identity?.isDeleted === true || identity?.isVoid === true || identity?.isActive === false)

  // Systemic guard: when the active identity is a blocked VPORT (deleted, void,
  // or inactive), immediately switch to the citizen actor.
  //
  // Why this is needed:
  // (1) After soft delete from VPORT mode, if switchActor in useAccountController
  //     partially fails, the in-memory identity stays as the VPORT.
  // (2) After a page reload, loadDefaultIdentityForUser re-hydrates the platform
  //     preference (VPORT) and loads it fresh from DB — isDeleted is now true —
  //     but BlockedVportGuard only covers VPORT dashboard routes. /feed, /chat,
  //     /settings etc. are unguarded, so the user navigates freely as a deleted VPORT.
  //
  // This effect fires once when blockedVport becomes true, switches to citizen,
  // and then blockedVport becomes false — no loop.
  useEffect(() => {
    if (!blockedVport) return
    const citizenActor = availableActors.find(a => a.actorKind === 'user')
    if (!citizenActor?.actorId) return
    switchActor(citizenActor.actorId, 'blocked_vport_auto_switch').catch(() => {})
  }, [blockedVport]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <IdentityContext.Provider
      value={{
        identity,
        loading,
        identityLoading: loading,
        setIdentity,
        switchActor,
        availableActors,
        refreshAvailableActors,
        blockedVport,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  return useContext(IdentityContext);
}

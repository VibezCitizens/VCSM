import { switchActiveActor as engineSwitchActiveActor } from "@identity";
import { loadIdentityForActorId } from "@/features/identity/identity.controller";
import { createSwitchDebugSession } from "@debuggers/actor-switch";
import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";

/**
 * Core switch-actor logic, decoupled from React state.
 *
 * Accepts a pre-resolved engine `ctx` (from useIdentityEngineQuery cache) so
 * resolveAuthenticatedContext is NOT called again — eliminating the duplicate
 * platform read that existed when switchActor lived inline in the context.
 *
 * If ctx is null/incomplete (cache miss on first render), falls back cleanly
 * with SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT so the caller can decide whether
 * to retry after the engine query loads.
 *
 * Returns: { success, code, nextIdentity, requestedActorId, availableActorIds, linkNotFound }
 * Caller is responsible for: version guard, saveIdentity(), commitIdentity(), cache invalidation.
 */
export async function switchActorController({
  actorId,
  ctx,
  currentActorId = null,
  entryPoint = "unknown",
}) {
  const dbg = import.meta.env.DEV
    ? createSwitchDebugSession({
        entryPoint,
        requestedActorId: actorId,
        previousActorId: currentActorId,
      })
    : { event() {}, error() {}, finish() {} };

  let engineContextResolved = false;
  let linkMatched             = false;
  let platformWriteAttempted  = false;
  let platformWriteSucceeded  = false;
  let hydrationSucceeded      = false;
  let revertAttempted         = false;
  let revertSucceeded         = false;
  let userAppAccountId        = ctx?.userAppAccountId ?? null;
  let actorLinkId             = null;
  let actorKind               = null;
  let actorSource             = null;
  let nextIdentity            = null;

  dbg.event("SWITCH_START", { status: "start", message: `Switch to ${actorId.slice(0, 8)}` });

  try {
    // 1. Validate cached ctx — no engine call needed when cache is warm
    if (!ctx?.userAppAccountId || !ctx?.availableActors?.length) {
      dbg.event("SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT", {
        status: "error",
        message: "No account or actors — ctx not yet loaded or missing",
        payload: { hasAccount: !!ctx?.userAppAccountId, actorCount: ctx?.availableActors?.length ?? 0 },
      });
      dbg.event("SWITCH_DONE", { status: "error", message: "Aborted: missing account context" });
      dbg.finish({
        appKey: "vcsm", requestedActorId: actorId, previousActorId: currentActorId,
        finalActorId: currentActorId, userAppAccountId: null, actorLinkId: null, actorSource: "vc",
        actorKind: null, entryPoint, engineContextResolved: false, linkMatched: false,
        platformWriteAttempted: false, platformWriteSucceeded: false,
        hydrationStarted: false, hydrationSucceeded: false, stateUpdated: false,
        localStorageWritten: false, localStorageRole: "cache_only",
        refreshRestoredSameActor: null, switchVerdict: null,
      });
      captureVcsmError({
        feature: 'identity',
        module: 'switchActor.controller',
        behavior_id: 'behavior.identity.switch_actor',
        severity: 'warning',
        message: 'switchActorController: missing account context — engine cache not yet loaded or account absent',
        operation: 'switchActorController',
        context: {
          hasAccountContext: !!ctx?.userAppAccountId,
          actorCount: ctx?.availableActors?.length ?? 0,
          switchCode: 'SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT',
          entryPoint,
        },
      });
      return { success: false, code: "SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT", requestedActorId: actorId, availableActorIds: [], linkNotFound: false, nextIdentity: null };
    }

    engineContextResolved = true;
    dbg.event("ENGINE_CONTEXT_RESOLVE_SUCCESS", {
      status: "success",
      payload: {
        userAppAccountId: ctx.userAppAccountId,
        activeActorBefore: ctx.activeActor?.actorId ?? null,
        availableCount: ctx.availableActors.length,
        availableActors: ctx.availableActors.map((a) => ({
          actorId: a.actorId, actorKind: a.actorKind,
          isSwitchable: a.isSwitchable, isPrimary: a.isPrimary,
        })),
        source: "react_query_cache",
      },
    });

    // 2. Match target actor link
    dbg.event("SWITCH_LINK_MATCH_START", { status: "start", payload: { target: actorId } });
    const link = ctx.availableActors.find((a) => a.actorId === actorId);

    if (!link?.id) {
      const availableActorIds = ctx.availableActors.map((a) => a.actorId);
      dbg.event("SWITCH_ABORT_LINK_NOT_FOUND", {
        status: "error",
        message: `No link found for actorId ${actorId.slice(0, 8)} — switch aborted (TERMINAL)`,
        payload: { availableIds: availableActorIds },
      });
      dbg.event("SWITCH_TERMINAL_ABORT", {
        status: "error",
        message: "Identity state unchanged. Background load blocked from overwriting.",
      });
      dbg.event("SWITCH_DONE", { status: "error", message: "Aborted: link not found" });
      dbg.finish({
        appKey: "vcsm", requestedActorId: actorId, previousActorId: currentActorId,
        finalActorId: currentActorId, userAppAccountId, actorLinkId: null, actorSource: "vc",
        actorKind: null, entryPoint, engineContextResolved, linkMatched: false,
        platformWriteAttempted: false, platformWriteSucceeded: false,
        hydrationStarted: false, hydrationSucceeded: false, stateUpdated: false,
        localStorageWritten: false, localStorageRole: "cache_only",
        refreshRestoredSameActor: null, switchVerdict: null,
      });
      captureVcsmError({
        feature: 'identity',
        module: 'switchActor.controller',
        behavior_id: 'behavior.identity.switch_actor',
        severity: 'error',
        message: 'switchActorController: actor link not found in available actors — switch aborted',
        operation: 'switchActorController',
        context: {
          hasAccountContext: true,
          linkNotFound: true,
          actorCount: ctx.availableActors.length,
          switchCode: 'SWITCH_ABORT_LINK_NOT_FOUND',
          entryPoint,
        },
      });
      return { success: false, code: "SWITCH_ABORT_LINK_NOT_FOUND", requestedActorId: actorId, availableActorIds, linkNotFound: true, nextIdentity: null };
    }

    linkMatched = true;
    actorLinkId = link.id;
    actorKind   = link.actorKind ?? null;
    actorSource = link.actorSource ?? "vc";
    dbg.event("SWITCH_LINK_MATCH_SUCCESS", {
      status: "success",
      payload: {
        actorLinkId: link.id, actorKind: link.actorKind,
        actorSource: link.actorSource, isSwitchable: link.isSwitchable, status: link.status,
      },
    });

    // 3. Write platform preference
    const previousActorLinkId = ctx.activeActor?.id ?? null;
    dbg.event("SWITCH_PLATFORM_WRITE_START", { status: "start" });
    platformWriteAttempted = true;

    try {
      await engineSwitchActiveActor({ userAppAccountId: ctx.userAppAccountId, actorLinkId: link.id });
    } catch (writeErr) {
      dbg.error("SWITCH_ABORT_PLATFORM_WRITE_FAILED", writeErr, {
        message: "Platform preference write failed — switch aborted",
      });
      dbg.event("SWITCH_DONE", { status: "error", message: "Aborted: platform write failed" });
      dbg.finish({
        appKey: "vcsm", requestedActorId: actorId, previousActorId: currentActorId,
        finalActorId: currentActorId, userAppAccountId, actorLinkId, actorSource: actorSource ?? "vc",
        actorKind, entryPoint, engineContextResolved, linkMatched,
        platformWriteAttempted: true, platformWriteSucceeded: false,
        hydrationStarted: false, hydrationSucceeded: false, stateUpdated: false,
        localStorageWritten: false, localStorageRole: "cache_only",
        refreshRestoredSameActor: null, switchVerdict: null,
      });
      return { success: false, code: "SWITCH_ABORT_PLATFORM_WRITE_FAILED", requestedActorId: actorId, availableActorIds: ctx.availableActors.map((a) => a.actorId), linkNotFound: false, nextIdentity: null };
    }

    platformWriteSucceeded = true;
    dbg.event("SWITCH_PLATFORM_WRITE_SUCCESS", { status: "success", message: "platform.user_app_preferences written" });
    dbg.event("SWITCH_ENGINE_EVENT_EMITTED", { status: "info", message: "ACTOR_SWITCHED event" });

    // 4. Hydrate VCSM domain data
    dbg.event("SWITCH_HYDRATION_START", { status: "start", payload: { actorId } });
    nextIdentity = await loadIdentityForActorId(actorId);

    if (nextIdentity) {
      hydrationSucceeded = true;
      actorKind = nextIdentity.kind ?? actorKind;
      dbg.event("SWITCH_HYDRATION_SUCCESS", {
        status: "success",
        payload: {
          actorId: nextIdentity.actorId, kind: nextIdentity.kind,
          displayName: nextIdentity.displayName, username: nextIdentity.username,
          realmId: nextIdentity.realmId,
        },
      });
    } else {
      dbg.event("SWITCH_HYDRATION_ERROR", { status: "error", message: "Hydration returned null — attempting rollback" });

      revertAttempted = previousActorLinkId !== null;

      captureVcsmError({
        feature: 'identity',
        module: 'switchActor.controller',
        behavior_id: 'behavior.identity.switch_actor',
        severity: 'error',
        message: 'switchActorController: hydration returned null after platform write — attempting revert to previous actor link',
        operation: 'loadIdentityForActorId',
        is_handled: true,
        context: {
          requestedActorId: actorId,
          currentActorId,
          targetActorLinkId: actorLinkId,
          previousActorLinkId,
          platformWriteAttempted: true,
          platformWriteSucceeded: true,
          hydrationSucceeded: false,
          revertAttempted,
          entryPoint,
        },
      });

      if (previousActorLinkId !== null) {
        try {
          await engineSwitchActiveActor({ userAppAccountId, actorLinkId: previousActorLinkId });
          revertSucceeded = true;
          dbg.event("SWITCH_REVERT_SUCCESS", { status: "success", message: "Platform preference restored to previous actor link" });
          captureVcsmError({
            feature: 'identity',
            module: 'switchActor.controller',
            behavior_id: 'behavior.identity.switch_actor',
            severity: 'warning',
            message: 'switchActorController: revert succeeded — platform preference restored to previous actor',
            operation: 'engineSwitchActiveActor.revert',
            is_handled: true,
            context: {
              requestedActorId: actorId,
              previousActorLinkId,
              revertSucceeded: true,
              switchCode: 'SWITCH_ABORT_HYDRATION_FAILED_REVERTED',
            },
          });
        } catch (revertErr) {
          revertSucceeded = false;
          dbg.error("SWITCH_REVERT_FAILED", revertErr, { message: "Rollback failed — platform preference diverged" });
          captureVcsmError({
            feature: 'identity',
            module: 'switchActor.controller',
            behavior_id: 'behavior.identity.switch_actor',
            severity: 'fatal',
            message: 'switchActorController: revert failed — platform preference remains diverged from React identity',
            operation: 'engineSwitchActiveActor.revert',
            is_handled: false,
            context: {
              requestedActorId: actorId,
              currentActorId,
              targetActorLinkId: actorLinkId,
              previousActorLinkId,
              revertError: revertErr?.message ?? null,
              revertErrorCode: revertErr?.code ?? null,
              switchCode: 'SWITCH_ABORT_HYDRATION_FAILED_UNRECOVERABLE',
              entryPoint,
            },
          });
        }
      } else {
        dbg.event("SWITCH_REVERT_SKIPPED", { status: "warn", message: "No previous actor link — rollback not possible" });
        captureVcsmError({
          feature: 'identity',
          module: 'switchActor.controller',
          behavior_id: 'behavior.identity.switch_actor',
          severity: 'fatal',
          message: 'switchActorController: revert not possible — no previous actor link — platform preference diverged',
          operation: 'engineSwitchActiveActor.revert',
          is_handled: false,
          context: {
            requestedActorId: actorId,
            currentActorId,
            targetActorLinkId: actorLinkId,
            previousActorLinkId: null,
            revertAttempted: false,
            switchCode: 'SWITCH_ABORT_HYDRATION_FAILED_UNRECOVERABLE',
            entryPoint,
          },
        });
      }
    }

    dbg.event("SWITCH_DONE", { status: hydrationSucceeded ? "success" : "error" });

  } catch (error) {
    dbg.error("SWITCH_DONE", error, { message: "Switch failed" });
  }

  // Note: localStorageWritten=false because saveIdentity() is called by the context
  // after the version guard passes. stateUpdated reflects hydration, not React commit.
  dbg.finish({
    appKey: "vcsm",
    requestedActorId: actorId,
    previousActorId: currentActorId,
    finalActorId: hydrationSucceeded ? actorId : (currentActorId ?? null),
    userAppAccountId,
    actorLinkId,
    actorSource: actorSource ?? "vc",
    actorKind,
    entryPoint,
    engineContextResolved,
    linkMatched,
    platformWriteAttempted,
    platformWriteSucceeded,
    hydrationStarted: platformWriteSucceeded,
    hydrationSucceeded,
    stateUpdated: hydrationSucceeded,
    localStorageWritten: false,
    localStorageRole: "cache_only",
    refreshRestoredSameActor: null,
    switchVerdict: null,
  });

  return {
    success: hydrationSucceeded,
    code: hydrationSucceeded
      ? "SWITCH_SUCCESS"
      : revertAttempted && revertSucceeded
        ? "SWITCH_ABORT_HYDRATION_FAILED_REVERTED"
        : "SWITCH_ABORT_HYDRATION_FAILED_UNRECOVERABLE",
    nextIdentity,
    requestedActorId: actorId,
    availableActorIds: [],
    linkNotFound: false,
  };
}

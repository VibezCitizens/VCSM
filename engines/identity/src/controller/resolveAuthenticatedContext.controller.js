// src/controller/resolveAuthenticatedContext.controller.js
// ============================================================
// Identity Engine — Resolve Authenticated Context
// ------------------------------------------------------------
// Main engine entry point. Orchestrates the full identity flow:
//
//   session → app → access → account → state + actors + roles + capabilities → context
//
// Returns an AuthenticatedContext or throws with a reason code.
// ============================================================

import { resolveSessionUser }     from '../services/sessionService.js'
import { resolveUserAppAccess, isAccessGranted } from '../services/accessService.js'
import { resolveUserAppAccount }  from '../services/accountService.js'
import { resolveAvailableActors, resolveActiveActor } from '../services/actorService.js'
import { resolveRoleKeys }        from '../services/roleService.js'
import { resolveCapabilityKeys }  from '../services/capabilityService.js'
import { resolveDefaultDestination } from '../services/destinationService.js'
import { dalGetAppByKey }         from '../dal/app.read.dal.js'
import { dalGetPreferencesForAccount } from '../dal/preferences.read.dal.js'
import { dalGetStateForAccount }  from '../dal/state.read.dal.js'
import { dalRecordLogin }         from '../dal/state.write.dal.js'
import { AppModel }               from '../model/App.model.js'
import { ActorLinkModel }         from '../model/ActorLink.model.js'
import { PreferencesModel }       from '../model/Preferences.model.js'
import { StateModel }             from '../model/State.model.js'
import { getAppContextResolver }  from '../config.js'
import { emit, EVENTS }           from '../events.js'
import { createResolveTrace }     from '../resolveTrace.js'

/**
 * Resolve the full authenticated context for a user in an app.
 *
 * @param {Object}  params
 * @param {string}  params.appKey          - the platform app key (e.g. 'vcsm', 'wentrex')
 * @param {boolean} [params.skipLoginRecord=false]
 *   Pass true from read-only / session-restore paths (e.g. resolveExisting on INITIAL_SESSION).
 *   Prevents dalRecordLogin from writing to platform.user_app_state during public-page bootstrap,
 *   which would otherwise 403 before grants are in place or trigger unnecessary writes on every
 *   page load when the user just has a cached session.
 * @returns {Promise<import('../types/index.js').AuthenticatedContext>}
 * @throws {{ code: string, message: string }}
 */
export async function resolveAuthenticatedContext({ appKey, skipLoginRecord = false, resolveAttempt = 'initial' }) {

  // Structured step logger — every step gets: step name, status, context, failure classification
  const _ctx = { userId: null, appKey, appId: null, uaaId: null, resolveAttempt }
  const _isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV
  const _t = (step, status, data) => {
    if (_isDev) {
      console.log(`[IdentityEngine] ${step} [${status}]`, { ..._ctx, ...data })
    }
  }

  // 1. Session
  let userId
  let trace = createResolveTrace({ appKey, resolveAttempt })
  try {
    _t('1_SESSION', 'START', {})
    userId = await resolveSessionUser()
  } catch (sessionErr) {
    _t('1_SESSION', 'ERROR', { dal: 'dalGetCurrentUser', file: 'session.read.dal.js', failureType: 'THROWN_ERROR', error: sessionErr?.message })
    throw sessionErr
  }
  if (!userId) {
    _t('1_SESSION', 'FAIL', { failureType: 'NULL_RESULT', dal: 'dalGetCurrentUser' })
    emit(EVENTS.SESSION_MISSING, { appKey })
    throw { code: 'NO_SESSION', message: 'User is not authenticated' }
  }
  _ctx.userId = userId
  trace = trace.child({ sessionUserId: userId })
  _t('1_SESSION', 'OK', {})

  // 2. App
  let appRow
  try {
    _t('2_APP', 'START', {})
    appRow = await dalGetAppByKey({ appKey, trace })
  } catch (appErr) {
    _t('2_APP', 'ERROR', { dal: 'dalGetAppByKey', file: 'app.read.dal.js', failureType: 'THROWN_ERROR', errorCode: appErr?.code, error: appErr?.message })
    throw appErr
  }
  if (!appRow) {
    _t('2_APP', 'FAIL', { dal: 'dalGetAppByKey', failureType: 'ZERO_ROWS' })
    throw { code: 'APP_NOT_FOUND', message: `App '${appKey}' not found or inactive` }
  }
  const app = AppModel(appRow)
  _ctx.appId = app.id
  trace = trace.child({ appId: app.id })
  _t('2_APP', 'OK', { appId: app.id })

  // 3. Access
  let access
  try {
    _t('3_ACCESS', 'START', { appId: app.id })
    access = await resolveUserAppAccess({ userId, appId: app.id, trace })
  } catch (accessErr) {
    _t('3_ACCESS', 'ERROR', { dal: 'dalGetUserAppAccess', file: 'access.read.dal.js', failureType: 'THROWN_ERROR', errorCode: accessErr?.code, error: accessErr?.message })
    throw accessErr
  }
  if (!isAccessGranted(access)) {
    const status = access?.status ?? 'none'
    _t('3_ACCESS', 'FAIL', { dal: 'dalGetUserAppAccess', failureType: access ? 'NOT_GRANTED' : 'ZERO_ROWS', status })
    emit(EVENTS.ACCESS_DENIED, { userId, appKey, accessStatus: status })
    throw { code: 'ACCESS_DENIED', message: `Access status: ${status}`, accessStatus: status }
  }
  _t('3_ACCESS', 'OK', { status: access.status })

  // 4. Account
  let account
  try {
    _t('4_ACCOUNT', 'START', {})
    account = await resolveUserAppAccount({ userId, appKey, trace })
  } catch (accountErr) {
    _t('4_ACCOUNT', 'ERROR', { dal: 'dalGetUserAppContextByKey', file: 'account.read.dal.js', failureType: 'THROWN_ERROR', errorCode: accountErr?.code, error: accountErr?.message })
    throw accountErr
  }
  if (!account) {
    _t('4_ACCOUNT', 'FAIL', { dal: 'dalGetUserAppContextByKey', failureType: 'ZERO_ROWS' })
    throw { code: 'ACCOUNT_NOT_FOUND', message: `No app account found for app '${appKey}'` }
  }
  const uaaId = account.id
  _ctx.uaaId = uaaId
  trace = trace.child({ userAppAccountId: uaaId })
  _t('4_ACCOUNT', 'OK', { uaaId })

  // 5. State + Preferences (parallel)
  let stateRow, prefsRow
  try {
    _t('5_STATE_PREFS', 'START', { uaaId })
    ;[stateRow, prefsRow] = await Promise.all([
      dalGetStateForAccount({ userAppAccountId: uaaId, trace }),
      dalGetPreferencesForAccount({ userAppAccountId: uaaId, trace }),
    ])
  } catch (spErr) {
    _t('5_STATE_PREFS', 'ERROR', { dal: 'dalGetStateForAccount|dalGetPreferencesForAccount', failureType: 'THROWN_ERROR', errorCode: spErr?.code, error: spErr?.message })
    throw spErr
  }
  _t('5_STATE_PREFS', 'OK', { hasState: !!stateRow, hasPrefs: !!prefsRow, activeLink: prefsRow?.active_actor_link_id ?? null })

  const state = stateRow ? StateModel(stateRow) : null
  const prefs = prefsRow ? PreferencesModel(prefsRow) : null

  // 6. Actor + role + capability resolution
  //    If app injected a resolver, use it (e.g. Wentrex queries learning schema).
  //    Otherwise fall back to platform schema queries.
  const appContextResolver = getAppContextResolver()

  let availableActors, roleKeys, capabilityKeys, resolverSuspended, resolverDestination

  // 6. Actor links + roles + capabilities
  _t('6_LINKS', 'START', { uaaId, resolver: appContextResolver ? 'app' : 'platform' })
  try {
    if (appContextResolver) {
      const appCtx = await appContextResolver({ userAppAccountId: uaaId, userId, trace })
      availableActors    = (appCtx.actorLinks ?? []).map((row) => ActorLinkModel(row))
      roleKeys           = appCtx.roleKeys ?? []
      capabilityKeys     = appCtx.capabilityKeys ?? []
      resolverSuspended  = appCtx.isSuspended ?? false
      resolverDestination = appCtx.defaultDestination ?? null
    } else {
      ;[availableActors, roleKeys, capabilityKeys] = await Promise.all([
        resolveAvailableActors({ userAppAccountId: uaaId, trace }),
        resolveRoleKeys({ userAppAccountId: uaaId }),
        resolveCapabilityKeys({ userAppAccountId: uaaId }),
      ])
      resolverSuspended   = false
      resolverDestination = null
    }
  } catch (linksErr) {
    _t('6_LINKS', 'ERROR', { dal: 'dalGetActorLinksForAccount', file: 'actorLinks.read.dal.js', failureType: 'THROWN_ERROR', errorCode: linksErr?.code, error: linksErr?.message })
    throw linksErr
  }

  _t('6_LINKS', 'OK', {
    count: availableActors.length,
    activeCount: availableActors.filter(a => a.status === 'active').length,
    primaryCount: availableActors.filter(a => a.isPrimary).length,
    actorIds: availableActors.map(a => a.actorId),
    actorKinds: availableActors.map(a => a.actorKind),
    prefsActiveLink: prefs?.activeActorLinkId ?? null,
    stateLastLink: state?.lastActorLinkId ?? null,
  })

  // 7. Active actor selection
  _t('7_ACTIVE_ACTOR', 'START', { linkCount: availableActors.length, prefsActiveLink: prefs?.activeActorLinkId ?? null })
  const activeActor = resolveActiveActor({ availableActors, preferences: prefs, state, trace })

  if (activeActor) {
    // Determine selection reason
    const reason =
      (prefs?.activeActorLinkId && activeActor.id === prefs.activeActorLinkId) ? 'PREFS_ACTIVE' :
      (state?.lastActorLinkId && activeActor.id === state.lastActorLinkId) ? 'STATE_LAST' :
      activeActor.isPrimary ? 'PRIMARY_FALLBACK' :
      'FIRST_FALLBACK'

    _t('7_ACTIVE_ACTOR', 'OK', {
      actorId: activeActor.actorId,
      actorLinkId: activeActor.id,
      actorKind: activeActor.actorKind,
      actorSource: activeActor.actorSource,
      isPrimary: activeActor.isPrimary,
      selectionReason: reason,
    })
  } else {
    _t('7_ACTIVE_ACTOR', 'FAIL', { failureType: availableActors.length === 0 ? 'NO_LINKS' : 'NO_MATCH', linkCount: availableActors.length })
  }

  // Suspension: platform-level state OR app-level resolver flag
  const isSuspended = state?.accountStatus === 'suspended' || resolverSuspended
  if (isSuspended) {
    emit(EVENTS.ACCOUNT_SUSPENDED, { userId, appKey, userAppAccountId: uaaId })
  }

  // 7. Record login (non-fatal)
  //    Skipped when skipLoginRecord=true (session-restore / public-page bootstrap paths).
  if (!skipLoginRecord) {
    _recordLoginSilent({ userAppAccountId: uaaId, isFirstLogin: !state?.firstLoginAt })
  }

  // 8. Build context
  trace.report({
    step: 'ENGINE_RESULT_BUILD_START',
    status: 'start',
    dalName: 'resolveAuthenticatedContext',
    fileName: 'resolveAuthenticatedContext.controller.js',
    queryMode: null,
    rowCount: null,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  let context
  try {
    context = {
      userId,
      appId:                app.id,
      appKey:               app.key,
      userAppAccountId:     uaaId,
      accessStatus:         access.status,
      accountStatus:        state?.accountStatus ?? account.status,
      availableActors,
      activeActor,
      roleKeys,
      capabilityKeys,
      requiresOnboarding:   state?.requiresOnboarding ?? false,
      requiresActorSelection: state?.requiresActorSelection ?? false,
      isSuspended,
      defaultDestination:   resolverDestination ?? resolveDefaultDestination(state),
    }
  } catch (buildErr) {
    trace.report({
      step: 'ENGINE_RESULT_BUILD_ERROR',
      status: 'error',
      message: buildErr?.message,
      error: buildErr,
      dalName: 'resolveAuthenticatedContext',
      fileName: 'resolveAuthenticatedContext.controller.js',
      queryMode: null,
      rowCount: null,
      errorCode: buildErr?.code ?? null,
      errorMessage: buildErr?.message ?? null,
      failureMode: 'THROWN_ERROR',
    })
    throw buildErr
  }

  trace.report({
    step: 'ENGINE_RESULT_BUILD_SUCCESS',
    status: 'success',
    dalName: 'resolveAuthenticatedContext',
    fileName: 'resolveAuthenticatedContext.controller.js',
    queryMode: null,
    rowCount: Array.isArray(availableActors) ? availableActors.length : 0,
    errorCode: null,
    errorMessage: null,
    failureMode: activeActor ? null : 'NO_ACTIVE_ACTOR',
    activeActorId: activeActor?.actorId ?? null,
    activeActorLinkId: activeActor?.id ?? null,
  })

  // 8. Result
  _t('8_RESULT', 'OK', {
    actorId: activeActor?.actorId ?? null,
    actorLinkId: activeActor?.id ?? null,
    actorSource: activeActor?.actorSource ?? null,
    actorKind: activeActor?.actorKind ?? null,
    availableActorCount: availableActors.length,
    hasState: !!state,
    hasPrefs: !!prefs,
  })

  emit(EVENTS.CONTEXT_RESOLVED, { userId, appKey, userAppAccountId: uaaId })

  return context
}

function _recordLoginSilent({ userAppAccountId, isFirstLogin }) {
  dalRecordLogin({ userAppAccountId, isFirstLogin }).catch(() => {})
}

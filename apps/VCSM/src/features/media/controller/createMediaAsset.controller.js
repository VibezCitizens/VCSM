import { mapUploadResultToMediaAsset, mapMediaAssetRow } from '@/features/media/model/mediaAsset.model'
import { insertMediaAssetDAL } from '@/features/media/dal/mediaAssets.write.dal'
import { resolveVcsmAppIdDAL } from '@/features/media/dal/resolveAppId.read.dal'
import { bugBunnyUploadStep, bugBunnyUploadError } from '@debuggers/media/bugBunnyUploadDebugger'

const APP_KEY = 'vcsm'

/**
 * createMediaAssetController — record a completed upload in platform.media_assets.
 *
 * Called after a successful uploadMediaController() result.
 * Does not re-upload anything — only writes the metadata row.
 *
 * @param {object} params
 * @param {import('@media').MediaUploadResult} params.mediaUploadResult — result from uploadMediaController
 * @param {string} params.ownerActorId       — actor who owns the file (canonical actorId)
 * @param {string} params.createdByActorId   — actor who triggered the upload (usually same)
 * @param {string} params.scope              — media engine scope key (e.g. 'user_avatar')
 * @param {string|null} [params.scopeId]     — ID of the owning domain entity (optional)
 * @param {string}      [params.mediaRole]   — media role within the entity (default 'original')
 * @param {object|null} [params.meta]        — caller-provided free-form metadata
 * @returns {Promise<object>} domain-safe media asset record
 * @throws {Error} on validation failure or DAL error
 */
export async function createMediaAssetController({
  mediaUploadResult,
  ownerActorId,
  createdByActorId,
  scope,
  scopeId   = null,
  mediaRole = 'original',
  meta      = null,
}) {
  if (!mediaUploadResult)            throw new Error('[createMediaAsset] mediaUploadResult is required')
  if (!mediaUploadResult.publicUrl)  throw new Error('[createMediaAsset] mediaUploadResult.publicUrl is required')
  if (!mediaUploadResult.storageKey) throw new Error('[createMediaAsset] mediaUploadResult.storageKey is required')
  if (!ownerActorId)                 throw new Error('[createMediaAsset] ownerActorId is required')
  if (!createdByActorId)             throw new Error('[createMediaAsset] createdByActorId is required')
  if (!scope)                        throw new Error('[createMediaAsset] scope is required')

  // Resolve app UUID from platform.apps — result is cached after first call.
  // platform.media_assets.app_id is type uuid; the app_key string 'vcsm' is not valid.
  const appId = await resolveVcsmAppIdDAL()

  const insertPayload = mapUploadResultToMediaAsset({
    mediaUploadResult,
    ownerActorId,
    createdByActorId,
    scope,
    scopeId,
    mediaRole,
    appId,
    meta,
  })

  bugBunnyUploadStep(scope, 'media_asset:insert', {
    appId,
    appKey:           APP_KEY,
    ownerActorId,
    createdByActorId,
    scopeType:        insertPayload.scope_type,
    storageKey:       mediaUploadResult.storageKey,
    scopeId,
  })
  if (import.meta.env?.DEV) console.log('[createMediaAsset] insert payload:', insertPayload)

  let row
  try {
    row = await insertMediaAssetDAL(insertPayload)
  } catch (e) {
    bugBunnyUploadError(scope, 'media_asset:insert-failed', e, { appId, ownerActorId, scopeId })
    if (import.meta.env?.DEV) console.warn('[createMediaAsset] insert failed:', e?.code, e?.message, e)
    throw e
  }

  if (import.meta.env?.DEV) console.log('[createMediaAsset] insert result:', { id: row?.id, scope_type: row?.scope_type, app_id: row?.app_id })
  bugBunnyUploadStep(scope, 'media_asset:inserted', { id: row?.id, appId, ownerActorId, scopeId })

  return mapMediaAssetRow(row)
}

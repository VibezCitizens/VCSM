// Pure mapping only — no I/O, no side effects, no Supabase.

/**
 * Maps each media engine scope to the platform.media_assets fields
 * that describe where and why a file was stored.
 *
 * Format: { ownerSource, scopeDomain, scopeType }
 *   ownerSource  — identity type of the actor who owns the file ('vc' | 'vport' | 'chat')
 *   scopeDomain  — functional domain the file belongs to ('vc' | 'vport' | 'chat')
 *   scopeType    — specific media role within that domain
 */
const SCOPE_MAP = Object.freeze({
  vibe_post:             { ownerSource: 'vc',    scopeDomain: 'vc',    scopeType: 'post_media' },
  story_24drop:          { ownerSource: 'vc',    scopeDomain: 'vc',    scopeType: 'post_media' },
  vdrop:                 { ownerSource: 'vc',    scopeDomain: 'vc',    scopeType: 'post_media' },
  user_avatar:           { ownerSource: 'vc',    scopeDomain: 'vc',    scopeType: 'profile_avatar' },
  user_banner:           { ownerSource: 'vc',    scopeDomain: 'vc',    scopeType: 'profile_banner' },
  vport_avatar:          { ownerSource: 'vport', scopeDomain: 'vport', scopeType: 'vport_avatar' },
  vport_banner:          { ownerSource: 'vport', scopeDomain: 'vport', scopeType: 'vport_banner' },
  portfolio_media:       { ownerSource: 'vport', scopeDomain: 'vport', scopeType: 'portfolio_media' },
  menu_item_photo:       { ownerSource: 'vport', scopeDomain: 'vport', scopeType: 'menu_item_photo' },
  chat_attachment:       { ownerSource: 'chat',  scopeDomain: 'chat',  scopeType: 'chat_attachment' },
  design_asset:          { ownerSource: 'vc',    scopeDomain: 'vc',    scopeType: 'design_asset' },
  wanders_card:          { ownerSource: 'vc',    scopeDomain: 'vc',    scopeType: 'wanders_card' },
  vport_creation_avatar: { ownerSource: 'vport', scopeDomain: 'vport', scopeType: 'vport_avatar' },
})

/**
 * Map a MediaUploadResult and caller context into a platform.media_assets insert payload.
 *
 * @param {object} params
 * @param {import('@media').MediaUploadResult} params.mediaUploadResult
 * @param {string} params.ownerActorId
 * @param {string} params.createdByActorId
 * @param {string} params.scope        — media engine scope key
 * @param {string|null} [params.scopeId]     — ID of the owning domain entity (optional)
 * @param {string}      [params.mediaRole]   — overrides default 'original'; must be a value in the DB CHECK constraint
 * @param {string}      params.appId         — platform.apps UUID (required — not the app key string)
 * @param {object|null} [params.meta]        — caller-provided free-form metadata
 * @returns {object} insert payload for platform.media_assets
 */
export function mapUploadResultToMediaAsset({
  mediaUploadResult,
  ownerActorId,
  createdByActorId,
  scope,
  scopeId   = null,
  mediaRole = 'original',
  appId,
  meta      = null,
}) {
  if (!appId) throw new Error('[MediaAssetModel] appId is required and must be a UUID — do not pass the app key string')
  const mapping = SCOPE_MAP[scope]
  if (!mapping) throw new Error(`[MediaAssetModel] Unknown scope: "${scope}"`)

  return {
    app_id:              appId,
    owner_source:        mapping.ownerSource,
    owner_actor_id:      ownerActorId,
    scope_domain:        mapping.scopeDomain,
    scope_type:          mapping.scopeType,
    scope_id:            scopeId                     ?? null,
    media_kind:          mediaUploadResult.mediaKind ?? 'image',
    media_role:          mediaRole,
    mime_type:           mediaUploadResult.mimeType,
    size_bytes:          mediaUploadResult.sizeBytes  ?? null,
    width:               mediaUploadResult.width      ?? null,
    height:              mediaUploadResult.height     ?? null,
    duration_ms:         null,
    storage_provider:    'cloudflare_r2',
    bucket:              'post-media',
    storage_key:         mediaUploadResult.storageKey,
    public_url:          mediaUploadResult.publicUrl,
    variants:            {},
    meta:                meta            ?? {},
    status:              'uploaded',
    created_by_actor_id: createdByActorId ?? null,
  }
}

/**
 * Map a raw platform.media_assets row into a domain-safe object.
 *
 * @param {object} row — raw DB row from insertMediaAssetDAL
 * @returns {object}
 */
export function mapMediaAssetRow(row) {
  return {
    id:               row.id,
    appId:            row.app_id,
    ownerSource:      row.owner_source,
    ownerActorId:     row.owner_actor_id,
    scopeDomain:      row.scope_domain,
    scopeType:        row.scope_type,
    scopeId:          row.scope_id            ?? null,
    mediaKind:        row.media_kind,
    mediaRole:        row.media_role,
    mimeType:         row.mime_type,
    sizeBytes:        row.size_bytes           ?? null,
    width:            row.width               ?? null,
    height:           row.height              ?? null,
    durationMs:       row.duration_ms         ?? null,
    storageProvider:  row.storage_provider,
    bucket:           row.bucket,
    storageKey:       row.storage_key,
    publicUrl:        row.public_url,
    variants:         row.variants            ?? null,
    meta:             row.meta                ?? null,
    status:           row.status,
    createdByActorId: row.created_by_actor_id ?? null,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  }
}

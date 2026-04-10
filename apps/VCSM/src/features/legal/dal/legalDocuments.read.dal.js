import { supabase } from '@/services/supabase/supabaseClient'

const LEGAL_DOC_SELECT = [
  'id',
  'app_id',
  'document_type',
  'version',
  'title',
  'content_url',
  'is_active',
  'published_at',
].join(', ')

/**
 * Fetch all active legal documents for a given app key.
 * Returns rows from platform.legal_documents where is_active = true.
 */
export async function dalGetActiveLegalDocuments({ appKey }) {
  // First resolve app_id from key
  const { data: app, error: appError } = await supabase
    .schema('platform')
    .from('apps')
    .select('id')
    .eq('key', appKey)
    .eq('is_active', true)
    .maybeSingle()

  if (appError) throw appError
  if (!app) return []

  const { data, error } = await supabase
    .schema('platform')
    .from('legal_documents')
    .select(LEGAL_DOC_SELECT)
    .eq('app_id', app.id)
    .eq('is_active', true)
    .order('document_type')

  if (error) throw error
  return data ?? []
}

/**
 * Fetch a single legal document by document_type and optional version.
 * If version is provided, returns that specific version.
 * Otherwise returns the active version for the given type.
 */
export async function dalGetLegalDocument({ appKey, documentType, version }) {
  const { data: app, error: appError } = await supabase
    .schema('platform')
    .from('apps')
    .select('id')
    .eq('key', appKey)
    .eq('is_active', true)
    .maybeSingle()

  if (appError) throw appError
  if (!app) return null

  let query = supabase
    .schema('platform')
    .from('legal_documents')
    .select(LEGAL_DOC_SELECT)
    .eq('app_id', app.id)
    .eq('document_type', documentType)

  if (version) {
    query = query.eq('version', version)
  } else {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data ?? null
}

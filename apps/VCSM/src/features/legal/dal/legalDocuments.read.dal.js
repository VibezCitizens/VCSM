import { supabase } from '@/services/supabase/supabaseClient'

const SCHEMA = 'platform'
const VIEW   = 'public_legal_documents_v'

const VIEW_SELECT = [
  'id',
  'app_key',
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
 * Reads from platform.public_legal_documents_v — view pre-filters
 * both apps.is_active and legal_documents.is_active.
 */
export async function dalGetActiveLegalDocuments({ appKey }) {
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(VIEW)
    .select(VIEW_SELECT)
    .eq('app_key', appKey)
    .order('document_type')

  if (error) throw error
  return data ?? []
}

/**
 * Fetch a single legal document by document_type and optional version.
 * Reads from platform.public_legal_documents_v.
 * View pre-filters active documents — version-specific lookup only returns
 * documents that are currently active.
 */
export async function dalGetLegalDocument({ appKey, documentType, version }) {
  let query = supabase
    .schema(SCHEMA)
    .from(VIEW)
    .select(VIEW_SELECT)
    .eq('app_key', appKey)
    .eq('document_type', documentType)

  if (version) {
    query = query.eq('version', version)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data ?? null
}

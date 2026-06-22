// src/services/supabase/vportClient.js
import { createLazySchemaClient } from '@/services/supabase/supabaseClient'

/**
 * Use this for all vport-schema tables.
 *
 * Lazily resolves `supabase.schema('vport')` on first use rather than at module
 * import, so importing this module never constructs the Supabase client.
 */
export const vport = createLazySchemaClient('vport')
export default vport

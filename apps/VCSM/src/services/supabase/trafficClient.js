// src/services/supabase/trafficClient.js
import { createLazySchemaClient } from '@/services/supabase/supabaseClient'

/**
 * Use this for all traffic-schema tables and RPCs (Traze provider directory +
 * the claim funnel).
 *
 * Lazily resolves `supabase.schema('traffic')` on first use rather than at
 * module import, so importing this module never constructs the Supabase client.
 */
export const traffic = createLazySchemaClient('traffic')
export default traffic

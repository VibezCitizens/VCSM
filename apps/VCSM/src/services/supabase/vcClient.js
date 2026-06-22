// src/lib/vcClient.js
import { createLazySchemaClient } from '@/services/supabase/supabaseClient'; //transfer

/**
 * Use this for all VC-schema tables.
 *
 * Lazily resolves `supabase.schema('vc')` on first use rather than at module
 * import, so importing this module never constructs the Supabase client (which
 * would otherwise require env vars at import time).
 */
export const vc = createLazySchemaClient('vc');
export default vc;

// src/services/supabase/reviewsClient.js
import { createLazySchemaClient } from '@/services/supabase/supabaseClient';

/**
 * Use this for all reviews-schema tables.
 *
 * Lazily resolves `supabase.schema('reviews')` on first use rather than at module
 * import, so importing this module never constructs the Supabase client.
 */
export const reviewsSchema = createLazySchemaClient('reviews');
export default reviewsSchema;

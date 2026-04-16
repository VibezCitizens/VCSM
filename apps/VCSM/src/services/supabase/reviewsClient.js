// src/services/supabase/reviewsClient.js
import { supabase } from '@/services/supabase/supabaseClient';

/** Use this for all reviews-schema tables */
export const reviewsSchema = supabase.schema('reviews');
export default reviewsSchema;

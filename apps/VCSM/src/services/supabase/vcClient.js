// src/lib/vcClient.js
import { supabase } from '@/services/supabase/supabaseClient'; //transfer

/** Use this for all VC-schema tables */
export const vc = supabase.schema('vc');
export default vc;

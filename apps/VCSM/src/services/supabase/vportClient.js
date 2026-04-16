// src/services/supabase/vportClient.js
import { supabase } from '@/services/supabase/supabaseClient'

/** Use this for all vport-schema tables */
export const vport = supabase.schema('vport')
export default vport

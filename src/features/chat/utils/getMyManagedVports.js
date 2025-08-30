// src/features/chat/utils/getMyManagedVports.js
import { supabase } from '@/lib/supabaseClient';

export async function getMyManagedVports() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { data: [], error: null };

  return await supabase
    .from('vport_managers')
    .select(
      'vport_id, vport:vports!vport_managers_vport_id_fkey ( id, name, avatar_url )'
    )
    .eq('manager_user_id', uid);
}


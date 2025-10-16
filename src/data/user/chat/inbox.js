// JS version
import { supabase } from '@/lib/supabaseClient';

export async function getUnreadTotal() {
  // unread chats only — calls RPC unread_total()
  const { data, error } = await supabase.rpc('unread_total');
  if (error) throw error;
  return data ?? 0;
}

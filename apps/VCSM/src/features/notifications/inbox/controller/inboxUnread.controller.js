// inboxUnread.controller.js
// Reads total unread chat message count from chat.inbox_entries.
// This powers the Vox badge in BottomNavBar — distinct from notification unreads.
import { supabase } from '@/services/supabase/supabaseClient'

export async function getInboxUnreadBadgeCount(actorId) {
  if (!actorId) return 0

  try {
    const { data, error } = await supabase
      .schema('chat')
      .from('inbox_entries')
      .select('unread_count')
      .eq('actor_id', actorId)
      .eq('archived', false)
      .eq('archived_until_new', false)

    if (error) return 0

    if (!Array.isArray(data) || data.length === 0) return 0

    return data.reduce((sum, row) => sum + Number(row.unread_count || 0), 0)
  } catch {
    return 0
  }
}

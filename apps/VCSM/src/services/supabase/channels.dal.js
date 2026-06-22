import { supabase } from './supabaseClient'

export function dalRemoveAllRealtimeChannels() {
  try {
    supabase.getChannels?.().forEach((ch) => supabase.removeChannel(ch))
  } catch (_) {
    // ignore channel cleanup failures
  }
}

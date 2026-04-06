import { getSupabaseClient } from '../config.js'

export function dalCreateTypingPresenceChannel({ conversationId, actorId }) {
  const supabase = getSupabaseClient()

  return supabase.channel(`chat-typing-${conversationId}`, {
    config: {
      presence: {
        key: actorId,
      },
    },
  });
}

export function dalRemoveTypingPresenceChannel(channel) {
  if (!channel) return;
  const supabase = getSupabaseClient()
  supabase.removeChannel(channel);
}

export async function dalTrackTypingPresence({ channel, actorPresentation }) {
  if (!channel) return;
  await channel.track({
    actor: actorPresentation,
    ts: Date.now(),
  });
}

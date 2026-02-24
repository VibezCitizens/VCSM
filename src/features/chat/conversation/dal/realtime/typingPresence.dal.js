import { supabase } from "@/services/supabase/supabaseClient";

export function dalCreateTypingPresenceChannel({ conversationId, actorId }) {
  return supabase.channel(`vc-typing-${conversationId}`, {
    config: {
      presence: {
        key: actorId,
      },
    },
  });
}

export function dalRemoveTypingPresenceChannel(channel) {
  if (!channel) return;
  supabase.removeChannel(channel);
}

export async function dalTrackTypingPresence({ channel, actorPresentation }) {
  if (!channel) return;
  await channel.track({
    actor: actorPresentation,
    ts: Date.now(),
  });
}

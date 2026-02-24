import {
  dalCreateTypingPresenceChannel,
  dalRemoveTypingPresenceChannel,
  dalTrackTypingPresence,
} from "@/features/chat/conversation/dal/realtime/typingPresence.dal";

export function ctrlCreateTypingPresenceChannel({ conversationId, actorId }) {
  return dalCreateTypingPresenceChannel({ conversationId, actorId });
}

export function ctrlRemoveTypingPresenceChannel(channel) {
  dalRemoveTypingPresenceChannel(channel);
}

export async function ctrlTrackTypingPresence({ channel, actorPresentation }) {
  await dalTrackTypingPresence({ channel, actorPresentation });
}

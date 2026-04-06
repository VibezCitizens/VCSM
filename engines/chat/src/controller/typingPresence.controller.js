import {
  dalCreateTypingPresenceChannel,
  dalRemoveTypingPresenceChannel,
  dalTrackTypingPresence,
} from '../dal/typingPresence.dal.js'

export function ctrlCreateTypingPresenceChannel({ conversationId, actorId }) {
  return dalCreateTypingPresenceChannel({ conversationId, actorId })
}

export function ctrlRemoveTypingPresenceChannel(channel) {
  dalRemoveTypingPresenceChannel(channel)
}

export async function ctrlTrackTypingPresence({ channel, actorPresentation }) {
  return dalTrackTypingPresence({ channel, actorPresentation })
}

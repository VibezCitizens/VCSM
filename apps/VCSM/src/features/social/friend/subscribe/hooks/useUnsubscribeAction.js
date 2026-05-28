// src/features/social/friend/subscribe/hooks/useUnsubscribeAction.js
import { ctrlUnsubscribe } from '@/features/social/friend/subscribe/controllers/unsubscribe.controller'


export function useUnsubscribeAction() {
  return async ({ followerActorId, followedActorId, assertingActorId }) => {
    return ctrlUnsubscribe({ followerActorId, followedActorId, assertingActorId })
  }
}

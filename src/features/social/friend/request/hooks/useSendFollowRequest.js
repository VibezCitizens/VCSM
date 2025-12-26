import { ctrlSendFollowRequest } from '@/features/social/friend/request/controllers/followRequests.controller'

export function useSendFollowRequest() {
  return async ({ requesterActorId, targetActorId }) => {
    return ctrlSendFollowRequest({ requesterActorId, targetActorId })
  }
}

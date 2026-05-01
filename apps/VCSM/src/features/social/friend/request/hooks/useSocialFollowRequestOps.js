import { ctrlListIncomingRequests } from '@/features/social/friend/request/controllers/followRequests.controller'

export function useSocialFollowRequestOps() {
  return { listIncomingRequests: ctrlListIncomingRequests }
}

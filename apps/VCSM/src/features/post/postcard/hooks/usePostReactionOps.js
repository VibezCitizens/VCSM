import { togglePostReactionController } from '@/features/post/postcard/controller/togglePostReaction.controller'
import { sendRoseController } from '@/features/post/postcard/controller/sendRose.controller'

export function usePostReactionOps() {
  return {
    toggleReaction: togglePostReactionController,
    sendRose: sendRoseController,
  }
}

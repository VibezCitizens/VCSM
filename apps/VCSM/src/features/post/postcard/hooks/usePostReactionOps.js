import { togglePostReactionController } from '@/features/post/postcard/controllers/togglePostReaction.controller'
import { sendRoseController } from '@/features/post/postcard/controllers/sendRose.controller'

export function usePostReactionOps() {
  return {
    toggleReaction: togglePostReactionController,
    sendRose: sendRoseController,
  }
}

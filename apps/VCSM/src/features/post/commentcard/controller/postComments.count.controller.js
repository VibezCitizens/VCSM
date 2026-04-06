import { countPostComments } from '@/features/post/commentcard/dal/postComments.count.dal';

export async function getPostCommentCount(postId) {
  return await countPostComments(postId);
}

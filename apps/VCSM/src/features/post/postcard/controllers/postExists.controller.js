import { checkPostExistsDAL, fetchPostByIdDAL } from '@/features/post/postcard/dal/post.read.dal';

export async function checkPostExistsController(postId) {
  return checkPostExistsDAL(postId);
}

export async function fetchPostActorIdController(postId) {
  const { data } = await fetchPostByIdDAL(postId);
  return data?.actor_id ?? null;
}

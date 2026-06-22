// [SHARED_ACTOR_PRIMITIVE] — serves both citizen and vport actor kinds
import { buildCanonicalProfilePostModel } from "@/features/profiles/model/postCanonical.model";

export function PostModel(postRow, reactions = {}, roseCount = 0) {
  return buildCanonicalProfilePostModel(postRow, { reactions, roseCount });
}

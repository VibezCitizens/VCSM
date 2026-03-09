import { buildCanonicalProfilePostModel } from "@/features/profiles/model/postCanonical.model";

export function PostModel(postRow, reactions = {}, roseCount = 0) {
  return buildCanonicalProfilePostModel(postRow, { reactions, roseCount });
}

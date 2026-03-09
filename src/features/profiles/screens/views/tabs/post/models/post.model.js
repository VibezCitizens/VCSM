// src/features/profiles/screens/views/tabs/post/models/post.model.js
import { buildCanonicalProfilePostModel } from "@/features/profiles/model/postCanonical.model";

export function PostModel(row) {
  return buildCanonicalProfilePostModel(row);
}

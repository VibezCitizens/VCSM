// src/learning/adapters/realm.adapter.js
// Thin public boundary — re-exports from controller only.

import { resolveLearningRealmController } from "@/learning/controller/resolveLearningRealm.controller";

export const resolveLearningRealm = resolveLearningRealmController;

export async function getLearningRealmAdapter(args = {}) {
  return resolveLearningRealmController(args);
}

export default getLearningRealmAdapter;

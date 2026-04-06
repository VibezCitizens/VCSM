// src/features/profiles/kinds/profileKindRegistry.js

import ActorProfileViewScreen from "@/features/profiles/screens/views/ActorProfileViewScreen";
import VportProfileKindScreen from "@/features/profiles/kinds/vport/screens/VportProfileKindScreen";

export const PROFILE_KIND_REGISTRY = Object.freeze({
  user: ActorProfileViewScreen,
  vport: VportProfileKindScreen, // ✅ NOW category-aware
});

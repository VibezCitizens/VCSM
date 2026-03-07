// src/features/settings/profile/adapter/ProfileTab.jsx

import { useProfileController } from "@/features/settings/profile/hooks/useProfileController";
import UserProfileTab from "./UserProfileTab";
import VportProfileTab from "./VportProfileTab";

export default function ProfileTab() {
  const controller = useProfileController();

  if (controller.mode === "vport") {
    return <VportProfileTab controller={controller} />;
  }

  return <UserProfileTab controller={controller} />;
}

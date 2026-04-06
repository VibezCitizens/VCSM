import { useCallback } from "react";
import { useStartConversation } from "@/features/chat/adapters/start/hooks/useStartConversation.adapter";

export function useProfileHeaderMessaging({ profileId }) {
  const { start } = useStartConversation();

  const handleMessage = useCallback(async () => {
    if (!profileId) return;
    await start({ id: profileId, kind: "user" });
  }, [profileId, start]);

  return { handleMessage };
}

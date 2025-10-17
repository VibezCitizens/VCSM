// src/features/chat/hooks/useOpenChat.js
import { useNavigate } from "react-router-dom";
import { useIdentity } from "@/state/identityContext";
import { openChatWithUser } from "@/features/chat/actions/openChatWithUser";

export function useOpenChat() {
  const navigate = useNavigate();
  const { identity } = useIdentity();
  return (targetUserId, onResolved) =>
    openChatWithUser({ identity, targetUserId, navigate, onResolved });
}

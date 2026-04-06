import { useParams, Navigate } from "react-router-dom";
import ConversationView from "./ConversationView";

export default function ConversationScreen() {
  const { conversationId } = useParams();

  if (!conversationId) return <Navigate to="/messages" replace />;

  return <ConversationView conversationId={conversationId} />;
}

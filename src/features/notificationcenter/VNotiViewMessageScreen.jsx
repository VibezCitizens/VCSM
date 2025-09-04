import { Navigate, useParams } from "react-router-dom";

export default function NotiViewVportMessageScreen() {
  const { conversationId } = useParams();
  if (conversationId) {
    return <Navigate to={`/vchat/${encodeURIComponent(conversationId)}`} replace />;
  }
  return <Navigate to="/vchat" replace />;
}

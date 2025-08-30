import { Navigate, useParams } from 'react-router-dom';

export default function NotiViewMessageScreen() {
  const { conversationId } = useParams();

  if (conversationId) {
    return (
      <Navigate
        to={`/chat/${encodeURIComponent(conversationId)}`}
        replace
      />
    );
  }
  // Fallback destination if the URL was malformed
  return <Navigate to="/chat" replace />;
}

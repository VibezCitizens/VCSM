import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function NotiViewMessageScreen() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (conversationId) {
      // redirect to chat view
      navigate(`/chat/${conversationId}`, { replace: true });
    }
  }, [conversationId, navigate]);

  return null; // nothing shown, it just redirects
}

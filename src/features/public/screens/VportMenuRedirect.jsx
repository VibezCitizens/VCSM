import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export function VportMenuRedirect() {
  const { actorId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!actorId) return;

    // Current internal route
    navigate(`/vport/${actorId}/menu`, { replace: true });
  }, [actorId, navigate]);

  return null;
}

export default VportMenuRedirect;

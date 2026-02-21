import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export function VportMenuRedirectScreen() {
  const { actorId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!actorId) return;

    // Actor-first canonical route
    navigate(`/profile/${actorId}?tab=menu`, { replace: true });
  }, [actorId, navigate]);

  return null;
}

export default VportMenuRedirectScreen;
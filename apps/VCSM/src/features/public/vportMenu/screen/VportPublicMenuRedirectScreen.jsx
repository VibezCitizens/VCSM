import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function VportPublicMenuRedirectScreen() {
  const { actorId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/menu`, { replace: true });
  }, [actorId, navigate]);

  return null;
}

export default VportPublicMenuRedirectScreen;

import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useActorCanonicalSlug } from "@/features/profiles/adapters/profiles.adapter";

export function VportPublicMenuRedirectScreen() {
  const { actorId } = useParams();
  const navigate = useNavigate();
  const { canonicalSlug, loading } = useActorCanonicalSlug(actorId);

  useEffect(() => {
    if (!actorId || loading) return;
    if (canonicalSlug && canonicalSlug !== actorId) {
      navigate(`/profile/${canonicalSlug}/menu`, { replace: true });
    } else {
      navigate(`/actor/${actorId}/menu`, { replace: true });
    }
  }, [actorId, canonicalSlug, loading, navigate]);

  return null;
}

export default VportPublicMenuRedirectScreen;

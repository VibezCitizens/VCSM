import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildActorCanonicalSlugController } from "@/features/profiles/controller/buildActorCanonicalSlug.controller";

export function VportPublicMenuRedirectScreen() {
  const { actorId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!actorId) return;
    let alive = true;

    buildActorCanonicalSlugController(actorId)
      .then(({ canonicalSlug }) => {
        if (!alive) return;
        if (canonicalSlug) {
          navigate(`/profile/${canonicalSlug}/menu`, { replace: true });
        } else {
          navigate(`/actor/${actorId}/menu`, { replace: true });
        }
      })
      .catch(() => {
        if (!alive) return;
        navigate(`/actor/${actorId}/menu`, { replace: true });
      });

    return () => { alive = false; };
  }, [actorId, navigate]);

  return null;
}

export default VportPublicMenuRedirectScreen;

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import getVportPublicDetailsController from "@/features/public/vportMenu/controller/getVportPublicDetails.controller";

export function VportMenuRedirect() {
  const { actorId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!actorId) return;
    let cancelled = false;

    // Resolve actorId → slug; redirect to canonical slug-based URL (PUBLIC-005 patch).
    // Falls back to legacy actor route if slug resolution fails.
    getVportPublicDetailsController({ actorId })
      .then((result) => {
        if (cancelled) return;
        const slug = result?.details?.username;
        navigate(slug ? `/profile/${slug}/menu` : `/actor/${actorId}/menu`, { replace: true });
      })
      .catch(() => {
        if (cancelled) return;
        navigate(`/actor/${actorId}/menu`, { replace: true });
      });

    return () => { cancelled = true; };
  }, [actorId, navigate]);

  return null;
}

export default VportMenuRedirect;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { resolveMenuSlugDAL } from "@/features/public/vportMenu/dal/resolveMenuSlug.dal";
import VportPublicMenuView from "@/features/public/vportMenu/view/VportPublicMenuView";

const notFoundStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#05060b",
  color: "rgba(255,255,255,0.4)",
  fontSize: 14,
  letterSpacing: 1,
};

export function VportPublicMenuBySlugScreen() {
  const { slug } = useParams();
  const [actorId, setActorId] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setActorId(null);
    setNotFound(false);

    if (!slug) {
      setNotFound(true);
      return;
    }

    resolveMenuSlugDAL(slug)
      .then((result) => {
        if (!alive) return;
        if (result?.actorId) {
          setActorId(result.actorId);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (alive) setNotFound(true);
      });

    return () => { alive = false; };
  }, [slug]);

  // No loading state — VportPublicMenuView handles its own skeleton.
  // Showing nothing while resolving avoids any flash of loading UI.
  if (notFound) {
    return <div style={notFoundStyle}>Menu not found.</div>;
  }

  if (!actorId) return null;

  return <VportPublicMenuView actorId={actorId} />;
}

export default VportPublicMenuBySlugScreen;

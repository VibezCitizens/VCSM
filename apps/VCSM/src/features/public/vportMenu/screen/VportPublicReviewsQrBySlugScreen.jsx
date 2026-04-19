import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { resolveActorBySlugOrUsernameDAL } from "@/features/profiles/dal/readActorSeoData.dal";
import VportPublicReviewsQrView from "@/features/public/vportMenu/view/VportPublicReviewsQrView";

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

export function VportPublicReviewsQrBySlugScreen() {
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

    resolveActorBySlugOrUsernameDAL(slug)
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

  if (notFound) {
    return <div style={notFoundStyle}>Reviews not found.</div>;
  }

  if (!actorId) return null;

  return <VportPublicReviewsQrView actorId={actorId} />;
}

export default VportPublicReviewsQrBySlugScreen;

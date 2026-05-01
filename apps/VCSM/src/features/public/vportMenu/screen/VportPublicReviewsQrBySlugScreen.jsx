import React from "react";
import { useParams } from "react-router-dom";
import { useResolveVportSlug } from "@/features/public/vportMenu/hooks/useResolveVportSlug";
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
  const { actorId, notFound } = useResolveVportSlug(slug);

  if (notFound) return <div style={notFoundStyle}>Reviews not found.</div>;
  if (!actorId) return null;

  return <VportPublicReviewsQrView actorId={actorId} />;
}

export default VportPublicReviewsQrBySlugScreen;

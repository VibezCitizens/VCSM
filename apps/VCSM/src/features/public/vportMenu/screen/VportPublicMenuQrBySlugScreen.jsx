import React from "react";
import { useParams } from "react-router-dom";
import { useResolveMenuSlug } from "@/features/public/vportMenu/hooks/useResolveMenuSlug";
import VportPublicMenuQrView from "@/features/public/vportMenu/view/VportPublicMenuQrView";

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

export function VportPublicMenuQrBySlugScreen() {
  const { slug } = useParams();
  const { actorId, notFound } = useResolveMenuSlug(slug);

  if (notFound) return <div style={notFoundStyle}>Menu not found.</div>;
  if (!actorId) return null;

  return <VportPublicMenuQrView actorId={actorId} />;
}

export default VportPublicMenuQrBySlugScreen;

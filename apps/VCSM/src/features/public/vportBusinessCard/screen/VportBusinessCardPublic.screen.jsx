import React, { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import VportBusinessCardPublicView from "@/features/public/vportBusinessCard/view/VportBusinessCardPublic.view";

export default function VportBusinessCardPublicScreen() {
  const params = useParams();
  const location = useLocation();
  const slug = useMemo(() => String(params?.slug || "").trim().toLowerCase(), [params]);
  const fromSettings = location.state?.fromSettings === true;

  return <VportBusinessCardPublicView slug={slug} fromSettings={fromSettings} />;
}

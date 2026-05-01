import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import VportBusinessCardPublicView from "@/features/public/vportBusinessCard/view/VportBusinessCardPublic.view";

export default function VportBusinessCardPublicScreen() {
  const params = useParams();
  const slug = useMemo(() => String(params?.slug || "").trim().toLowerCase(), [params]);

  return <VportBusinessCardPublicView slug={slug} />;
}

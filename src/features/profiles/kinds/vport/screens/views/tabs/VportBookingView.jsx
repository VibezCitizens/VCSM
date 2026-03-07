import React from "react";
import VportBookingViewScreen from "@/features/profiles/kinds/vport/screens/booking/view/VportBookingView";

export default function VportBookingView({ profile, isOwner = false }) {
  return (
    <VportBookingViewScreen profile={profile} isOwner={isOwner} />
  );
}

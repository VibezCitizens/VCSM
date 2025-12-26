// src/features/settings/vports/controller/Vports.controller.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/AuthProvider";
import { useIdentity } from "@/state/identity/identityContext";

import { useVportsList } from "@/features/settings/vports/hooks/useVportsList";
import { useProfileActor } from "@/features/settings/vports/hooks/useProfileActor";
import { useVportSwitch } from "../hooks/useVportSwitcher";

export function useVportsController() {
  const { user } = useAuth() || {};
  const { identity, switchActor } = useIdentity();
  const navigate = useNavigate();

  const { items, setItems } = useVportsList();
  const profileActorId = useProfileActor(user?.id);

  const [busy, setBusy] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [activeActor, setActiveActor] = useState("profile");

  const { switchToProfile, switchToVport } = useVportSwitch({
    user,
    identity,
    switchActor,
    navigate,
  });

  useEffect(() => {
    if (identity?.kind === "vport") {
      setActiveActor(`vport:${identity.vportId}`);
    } else {
      setActiveActor("profile");
    }
  }, [identity?.kind, identity?.vportId]);

  return {
    items,
    setItems,
    busy,
    setBusy,
    showCreator,
    setShowCreator,
    activeActor,
    profileActorId,
    switchToProfile,
    switchToVport,
  };
}

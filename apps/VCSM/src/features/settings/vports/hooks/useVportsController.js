import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/AuthProvider";
import { useIdentity } from "@/state/identity/identityContext";

import { useVportsList } from "@/features/settings/vports/hooks/useVportsList";
import { useProfileActor } from "@/features/settings/vports/hooks/useProfileActor";
import { useVportSwitch } from "@/features/settings/vports/hooks/useVportSwitcher";

export function useVportsController() {
  const { user } = useAuth() || {};
  const { identity, switchActor, availableActors, refreshAvailableActors } = useIdentity();
  const navigate = useNavigate();

  const { items, setItems } = useVportsList();
  const profileActorId = useProfileActor(user?.id);

  const [busy, setBusy] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [activeActor, setActiveActor] = useState("profile");
  const [blockedMsg, setBlockedMsg] = useState(null);

  const { switchToProfile, switchToVport } = useVportSwitch({
    user,
    identity,
    switchActor,
    availableActors,
    navigate,
    onBlocked: (msg) => setBlockedMsg(msg),
  });

  useEffect(() => {
    if (identity?.kind === "vport") {
      setActiveActor(`vport:${identity.actorId}`);
    } else {
      setActiveActor("profile");
    }
  }, [identity?.kind, identity?.actorId]);

  /**
   * Resolve the correct switchable actorId for a vport profile row.
   * Used for isActive display — vport.profiles.actor_id may be stale.
   * Falls back to v.actor_id so the UI renders something even on cache miss.
   */
  const resolveVportActorId = useCallback((v) => {
    const vportLinks = (availableActors ?? []).filter(
      (a) => a.actorKind === 'vport' && a.isSwitchable !== false,
    );
    const byId = vportLinks.find((a) => a.actorId === v.actor_id);
    if (byId) return byId.actorId;
    if (v.name) {
      const byName = vportLinks.find((a) => a.displayName === v.name);
      if (byName) return byName.actorId;
    }
    return v.actor_id;
  }, [availableActors]);

  /**
   * Called by VportsTab after a vport is successfully created.
   * Updates the display list AND refreshes availableActors so the new
   * vport actor link is immediately switchable without a full reload.
   */
  const onVportCreated = useCallback(({ list }) => {
    if (Array.isArray(list)) setItems(list);
    refreshAvailableActors();
  }, [refreshAvailableActors]);

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
    resolveVportActorId,
    onVportCreated,
    blockedMsg,
    clearBlockedMsg: () => setBlockedMsg(null),
  };
}

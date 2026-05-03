import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/AuthProvider";
import { useIdentity } from "@/state/identity/identityContext";

import { useVportsList } from "@/features/settings/vports/hooks/useVportsList";
import { useProfileActor } from "@/features/settings/vports/hooks/useProfileActor";
import { useVportSwitch } from "@/features/settings/vports/hooks/useVportSwitcher";
import { ctrlRestoreVport, ctrlHardDeleteVport } from "@/features/settings/account/controller/account.controller";
import { ctrlSetVportBusinessCardPublishState } from "@/features/settings/vports/controller/vportBusinessCard.controller";

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

  const [restoreTarget, setRestoreTarget] = useState(null);
  const [busyRestore, setBusyRestore] = useState(false);
  const [errRestore, setErrRestore] = useState('');

  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
  const [busyHardDelete, setBusyHardDelete] = useState(false);
  const [errHardDelete, setErrHardDelete] = useState('');

  const [busyCardPublishId, setBusyCardPublishId] = useState(null);
  const [errCardPublish, setErrCardPublish] = useState('');
  const [errCardPublishId, setErrCardPublishId] = useState(null);

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

  const onVportCreated = useCallback(({ list }) => {
    if (Array.isArray(list)) setItems(list);
    refreshAvailableActors();
  }, [refreshAvailableActors]);

  const restoreVport = useCallback(async (targetVportId) => {
    setBusyRestore(true);
    setErrRestore('');
    if (import.meta.env.DEV) console.log('[restore:start]', { surface: 'vports_tab', vportId: targetVportId });
    try {
      if (!targetVportId) throw new Error('No VPORT selected.');
      await ctrlRestoreVport({ vportId: targetVportId });
      setItems(prev => prev.map(v => v.id === targetVportId ? { ...v, is_deleted: false, is_active: true } : v));
      refreshAvailableActors();
      if (import.meta.env.DEV) console.log('[restore:success]', { surface: 'vports_tab', vportId: targetVportId });
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.log('[restore:error]', { surface: 'vports_tab', vportId: targetVportId, error: error?.message });
      setErrRestore(error?.message || 'Could not restore the VPORT.');
      return false;
    } finally {
      setBusyRestore(false);
    }
  }, [setItems, refreshAvailableActors]);

  const hardDeleteVport = useCallback(async (targetVportId) => {
    setBusyHardDelete(true);
    setErrHardDelete('');
    try {
      if (!targetVportId) throw new Error('No VPORT selected.');
      await ctrlHardDeleteVport({ vportId: targetVportId });
      return true;
    } catch (error) {
      setErrHardDelete(error?.message || 'Could not permanently delete the VPORT.');
      return false;
    } finally {
      setBusyHardDelete(false);
    }
  }, []);

  const setBusinessCardPublished = useCallback(async (vportId, published) => {
    setBusyCardPublishId(vportId);
    setErrCardPublish('');
    setErrCardPublishId(null);
    try {
      await ctrlSetVportBusinessCardPublishState({ vportId, published });
      setItems(prev => prev.map(v => v.id === vportId ? { ...v, business_card_published: published } : v));
      return true;
    } catch (err) {
      setErrCardPublish(err?.message || 'Could not update business card.');
      setErrCardPublishId(vportId);
      return false;
    } finally {
      setBusyCardPublishId(null);
    }
  }, [setItems]);

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
    refreshAvailableActors,
    restoreTarget,
    setRestoreTarget,
    busyRestore,
    errRestore,
    restoreVport,
    hardDeleteTarget,
    setHardDeleteTarget,
    busyHardDelete,
    errHardDelete,
    hardDeleteVport,
    busyCardPublishId,
    errCardPublish,
    errCardPublishId,
    setBusinessCardPublished,
  };
}

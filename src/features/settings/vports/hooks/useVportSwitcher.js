// src/features/settings/vports/hooks/useVportSwitch.js
import { supabase } from "@/services/supabase/supabaseClient";

export function useVportSwitch({ user, identity, switchActor, navigate }) {
  const getAuthedUserId = async () => {
    if (user?.id) return user.id;

    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    const uid = data?.user?.id;
    if (!uid) throw new Error("Not authenticated");

    return uid;
  };

  const switchToProfile = async (profileActorId, setBusy) => {
    if (identity?.kind === "user") return;
    if (!profileActorId) {
      console.error("[Vports] profile actor not resolved");
      return;
    }

    setBusy(true);
    try {
      await switchActor(profileActorId);
      const meId = await getAuthedUserId();
      navigate(`/notifications?actor=profile:${meId}`);
    } finally {
      setBusy(false);
    }
  };

  const switchToVport = async (v, setBusy) => {
    if (!v.actor_id) {
      console.error("[Vports] missing actor_id", v);
      return;
    }

    setBusy(true);
    try {
      await switchActor(v.actor_id);
      navigate(`/vport/notifications?actor=vport:${v.id}`);
    } finally {
      setBusy(false);
    }
  };

  return { switchToProfile, switchToVport };
}

// src/features/settings/vports/hooks/useProfileActor.js
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";

export function useProfileActor(userId) {
  const [profileActorId, setProfileActorId] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let alive = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .schema("vc")
          .from("actor_owners")
          .select(`
            actor:actors (
              id,
              kind
            )
          `)
          .eq("user_id", userId);

        if (error) throw error;

        const userActor = data
          ?.map((r) => r.actor)
          ?.find((a) => a?.kind === "user");

        if (alive) {
          setProfileActorId(userActor?.id ?? null);
        }
      } catch (e) {
        console.error("[useProfileActor] failed", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  return profileActorId;
}

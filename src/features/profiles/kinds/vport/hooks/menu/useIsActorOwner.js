// src/features/profiles/kinds/vport/hooks/useIsActorOwner.js

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * UI-only ownership check.
 * Security is enforced by RLS.
 */
export function useIsActorOwner({ actorId }) {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!actorId) {
        if (alive) {
          setIsOwner(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          if (alive) {
            setIsOwner(false);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("actor_owners")
          .select("actor_id")
          .eq("actor_id", actorId)
          .eq("user_id", user.id)
          .eq("is_void", false)
          .maybeSingle();

        if (!alive) return;

        setIsOwner(!!data && !error);
      } catch {
        if (alive) setIsOwner(false);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [actorId]);

  return { isOwner, loading };
}

import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";

export default function VportToActorRedirect() {
  const { vportId } = useParams();
  const [actorId, setActorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!vportId) return;

        const { data, error } = await supabase
          .schema("vc")
          .from("actors")
          .select("id")
          .eq("kind", "vport")
          .eq("vport_id", vportId)
          .maybeSingle();

        if (error) throw error;

        if (alive) setActorId(data?.id ?? null);
      } catch (e) {
        console.error("[VportToActorRedirect] failed", e);
        if (alive) setActorId(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [vportId]);

  if (loading) {
    return <div className="p-10 text-center text-neutral-400">Loading…</div>;
  }

  if (!actorId) {
    return <Navigate to="/feed" replace />;
  }

  // ✅ now goes through ActorProfileScreen -> kind registry -> VportProfileKindScreen -> tabs
  return <Navigate to={`/profile/${actorId}`} replace />;
}

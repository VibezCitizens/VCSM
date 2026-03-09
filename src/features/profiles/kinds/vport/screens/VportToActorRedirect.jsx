import { Navigate, useParams } from "react-router-dom";
import { useVportActorIdByVportId } from "@/features/profiles/kinds/vport/hooks/useVportActorIdByVportId";

export default function VportToActorRedirect() {
  const { vportId } = useParams();
  const { actorId, loading } = useVportActorIdByVportId(vportId);

  if (loading) {
    return <div className="p-10 text-center text-neutral-400">Loading…</div>;
  }

  if (!actorId) {
    return <Navigate to="/feed" replace />;
  }

  // ✅ now goes through ActorProfileScreen -> kind registry -> VportProfileKindScreen -> tabs
  return <Navigate to={`/profile/${actorId}`} replace />;
}

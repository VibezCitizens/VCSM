import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { useIdentity } from "@/state/identity/identityContext";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import VportDashboardLeadsView from "./VportDashboardLeadsView";

/**
 * Final Screen — route entry + identity gate + ownership gate only.
 *
 * Responsibilities:
 *   - Extract actorId from route params
 *   - Guard against missing actorId
 *   - Gate on identity (loading → skeleton, unauthenticated → sign-in message)
 *   - Gate on ownership (forbidden message for non-owners)
 *   - Render VportDashboardLeadsView for verified owners
 *
 * Must not: call feature hooks, compute data, or render feature UI directly.
 */
export default function VportDashboardLeadsFinalScreen() {
  const params = useParams();
  const { identity, identityLoading } = useIdentity();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);

  if (!actorId) return null;

  if (identityLoading || ownershipLoading) {
    return (
      <div className="px-4 py-6">
        <SkeletonCardList count={3} showBody={false} />
      </div>
    );
  }

  if (!identity) {
    return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  }

  if (!isOwner) {
    return (
      <div className="p-10 text-center text-white/50">
        You can only access leads for your own vport.
      </div>
    );
  }

  return <VportDashboardLeadsView actorId={actorId} />;
}

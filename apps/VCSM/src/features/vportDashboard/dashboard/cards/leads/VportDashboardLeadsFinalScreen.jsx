import { SkeletonCardList } from "@/shared/components/Skeleton";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useVportDashboardContext } from "@/features/vportDashboard/adapters/vportDashboard.adapter";
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
  const { identity, identityLoading } = useIdentity();
  const { loading: ownershipLoading, vportActorId: actorId, canManage: isOwner } = useVportDashboardContext();

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

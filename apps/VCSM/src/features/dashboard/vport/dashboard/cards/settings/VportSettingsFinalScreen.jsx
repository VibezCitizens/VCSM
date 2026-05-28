import { useParams } from "react-router-dom";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { useIdentity } from "@/state/identity/identityContext";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import VportSettingsScreen from "./VportSettingsScreen";

/**
 * VPD-V-FIX-008: Final Screen — route entry + identity gate only.
 *
 * Responsibilities:
 *   - Reads actorId from route params
 *   - Resolves identity + ownership
 *   - Renders loading / auth / ownership guards
 *   - Delegates all view composition to VportSettingsScreen (View Screen)
 *
 * Must never contain hooks beyond identity gating, business logic, or
 * data fetching unrelated to the ownership gate.
 */
export default function VportSettingsFinalScreen() {
  const { actorId } = useParams();
  const { identity, identityLoading } = useIdentity();
  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);

  if (!actorId) return null;

  if (identityLoading || ownershipLoading) {
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  }

  if (!identity) {
    return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  }

  if (!isOwner) {
    return <div className="p-10 text-center text-white/50">You can only edit settings for your own vport.</div>;
  }

  return <VportSettingsScreen actorId={actorId} isOwner={isOwner} />;
}

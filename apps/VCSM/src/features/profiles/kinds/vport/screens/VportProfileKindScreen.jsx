import { useVportType } from "@/features/profiles/hooks/useVportType";
import VportProfileViewScreen from "@/features/profiles/kinds/vport/screens/VportProfileViewScreen";
import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/getVportTabsByType.model";
import "@/features/profiles/styles/profiles-modern.css";

export default function VportProfileKindScreen({
  viewerActorId,
  profileActorId,
  identity,
  prefetchedVportType,
  vportTypeLoading: prefetchLoading,
}) {
  // Use prefetched vportType from ActorProfileScreen when available (parallel fetch).
  // Fall back to own fetch if props are not provided (e.g., direct usage elsewhere).
  const hasPrefetch = prefetchedVportType !== undefined || prefetchLoading !== undefined;
  const { loading: ownLoading, vportType: ownVportType } = useVportType(
    hasPrefetch ? null : profileActorId
  );

  const loading = hasPrefetch ? !!prefetchLoading : ownLoading;
  const vportType = hasPrefetch ? prefetchedVportType : ownVportType;

  if (loading) {
    return <div className="profiles-modern p-10 text-center profiles-muted">Loading...</div>;
  }

  const tabs = getVportTabsByType(vportType?.type);

  return (
    <VportProfileViewScreen
      viewerActorId={viewerActorId}
      profileActorId={profileActorId}
      identity={identity}
      tabs={tabs}
    />
  );
}

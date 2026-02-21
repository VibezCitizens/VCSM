import { useVportType } from "@/features/profiles/hooks/useVportType";
import VportProfileViewScreen from "@/features/profiles/kinds/vport/screens/VportProfileViewScreen";
import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/gas/getVportTabsByType.model";
export default function VportProfileKindScreen({ viewerActorId, profileActorId }) {
  const { loading, vportType } = useVportType(profileActorId);

  if (loading) {
    return <div className="p-10 text-center text-neutral-400">Loading…</div>;
  }

  // vportType is { vportId, type }
  const tabs = getVportTabsByType(vportType?.type);

  return (
    <VportProfileViewScreen
      viewerActorId={viewerActorId}
      profileActorId={profileActorId}
      tabs={tabs}
    />
  );
}

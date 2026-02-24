import { useVportType } from "@/features/profiles/hooks/useVportType";
import VportProfileViewScreen from "@/features/profiles/kinds/vport/screens/VportProfileViewScreen";
import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/gas/getVportTabsByType.model";
import "@/features/profiles/styles/profiles-modern.css";

export default function VportProfileKindScreen({ viewerActorId, profileActorId }) {
  const { loading, vportType } = useVportType(profileActorId);

  if (loading) {
    return <div className="profiles-modern p-10 text-center profiles-muted">Loading...</div>;
  }

  const tabs = getVportTabsByType(vportType?.type);

  return (
    <VportProfileViewScreen
      viewerActorId={viewerActorId}
      profileActorId={profileActorId}
      tabs={tabs}
    />
  );
}

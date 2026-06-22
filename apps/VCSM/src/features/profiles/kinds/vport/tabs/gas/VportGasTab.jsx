import { VportGasPricesView } from "@/features/profiles/adapters/kinds/vport/screens/gas/VportGasPricesView.adapter";

export default function VportGasTab({ profileActorId, identity, isOwner }) {
  return (
    <div className="mt-4">
      <VportGasPricesView actorId={profileActorId} identity={identity} isOwner={isOwner} />
    </div>
  );
}

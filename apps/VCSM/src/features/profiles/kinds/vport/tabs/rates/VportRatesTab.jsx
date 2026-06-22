import VportRatesView from "@/features/profiles/kinds/vport/screens/rates/view/VportRatesView";

export default function VportRatesTab({ profileActorId }) {
  return (
    <div className="mt-4">
      <VportRatesView actorId={profileActorId} rateType="fx" />
    </div>
  );
}

import VportAboutView from "@/features/profiles/kinds/vport/screens/views/tabs/VportAboutView";

export default function VportAboutTab({ profile, publicDetails, publicDetailsLoading }) {
  return (
    <>
      <VportAboutView profile={profile} details={publicDetails} />
      {publicDetailsLoading && !publicDetails && (
        <div className="mt-4 text-xs profiles-muted">Loading public details...</div>
      )}
    </>
  );
}

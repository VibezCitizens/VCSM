import VportMenuView from "@/features/profiles/kinds/vport/screens/views/tabs/VportMenuView";

export default function VportMenuTab({ profile, onConsumedReviewsTab, onSetTab }) {
  return (
    <VportMenuView
      profile={profile}
      onOpenFoodReview={() => {
        onConsumedReviewsTab?.("food");
        onSetTab("reviews");
      }}
    />
  );
}

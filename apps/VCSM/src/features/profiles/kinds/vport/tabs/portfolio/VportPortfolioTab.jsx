import VportPortfolioView from "@/features/profiles/kinds/vport/screens/views/tabs/VportPortfolioView";

export default function VportPortfolioTab({ profile, effectiveTabs, onSetTab }) {
  return (
    <VportPortfolioView
      profile={profile}
      availableTabs={effectiveTabs}
      onSelectTab={onSetTab}
    />
  );
}

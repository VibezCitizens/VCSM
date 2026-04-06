import PortfolioTab from "@/features/profiles/kinds/vport/screens/portfolio/PortfolioTab";

export default function VportPortfolioView({
  profile,
  posts = [],
  loadingPosts = false,
  availableTabs = [],
  onSelectTab = null,
}) {
  return (
    <PortfolioTab
      profile={profile}
      posts={posts}
      loadingPosts={loadingPosts}
      availableTabs={availableTabs}
      onSelectTab={onSelectTab}
    />
  );
}

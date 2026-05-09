import { readReviewSummaries, readRecentReviews } from "@/features/dashboard/dal/trafficReviews.read.dal";
import { listTrazeProviders } from "@/features/traze/data/trazeProvider.repo";
import { listTrazeCategories } from "@/features/traze/data/trazeCategory.repo";

export async function loadDashboardStats() {
  const [providers, categories, summaries, recentReviews] = await Promise.all([
    listTrazeProviders(),
    listTrazeCategories(),
    readReviewSummaries(),
    readRecentReviews(),
  ]);

  const total       = providers.length;
  const active      = providers.filter((p) => p.isActive).length;
  const withAvatar  = providers.filter((p) => p.avatarUrl || p.logoUrl).length;
  const withPhone   = providers.filter((p) => p.phone).length;
  const withHours   = providers.filter((p) => p.hours).length;
  const withBooking = 0;
  const claimed     = providers.filter((p) => p.isClaimed).length;
  const withCity    = providers.filter((p) => p.citySlug || p.cityName).length;
  const withService = providers.filter((p) => p.hasService).length;

  const cityMap = new Map();
  for (const p of providers) {
    if (!p.citySlug) continue;
    const prev = cityMap.get(p.citySlug) ?? { name: [p.cityName, p.stateCode, p.countryCode].filter(Boolean).join(", ") || p.citySlug, count: 0 };
    cityMap.set(p.citySlug, { ...prev, count: prev.count + 1 });
  }
  const topCities = [...cityMap.entries()]
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const categoryMap = new Map();
  for (const p of providers) {
    if (!p.categoryKey) continue;
    categoryMap.set(p.categoryKey, (categoryMap.get(p.categoryKey) ?? 0) + 1);
  }
  const topCategories = categories
    .map((c) => ({
      key: c.serviceKey,
      label: c.serviceName,
      count: Number(c.providerCount ?? categoryMap.get(c.key) ?? 0),
      services: c.services ?? [],
      isLive: c.providerCount > 0
    }))
    .sort((a, b) => b.count - a.count);

  const liveCategoryCount = categories.filter((c) => c.isLive === true).length;
  const notLiveCategoryCount = Math.max(0, categories.length - liveCategoryCount);

  const totalReviews   = summaries.reduce((sum, r) => sum + (r.review_count ?? 0), 0);
  const weightedRating = summaries.reduce((sum, r) => sum + (r.average_rating ?? 0) * (r.review_count ?? 0), 0);
  const avgRating      = totalReviews > 0 ? weightedRating / totalReviews : 0;

  return {
    totals: {
      providers: total,
      active,
      cities:     cityMap.size,
      categories: categories.length,
      liveCategories: liveCategoryCount,
      notLiveCategories: notLiveCategoryCount,
      withAvatar,
      withPhone,
      withHours,
      withBooking,
      claimed,
      unclaimed:  total - claimed,
      reviews:    totalReviews,
      avgRating,
    },
    topCities,
    topCategories,
    recentReviews,
    quality: {
      missingAvatar:   total - withAvatar,
      missingPhone:    total - withPhone,
      missingHours:    total - withHours,
      missingBooking:  total - withBooking,
      missingCity:     total - withCity,
      missingService:  total - withService,
    },
    fetchedAt: new Date().toISOString(),
  };
}

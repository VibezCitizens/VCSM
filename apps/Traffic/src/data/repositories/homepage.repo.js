import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getCityBySlug } from "@/data/repositories/city.repo";
import { getCountryByCode, getCountryById } from "@/data/repositories/geo.repo";
import {
  listProviders,
  listServicesForProvider
} from "@/data/repositories/provider.repo";
import { getServiceById } from "@/data/repositories/service.repo";
import { countryProviderPath } from "@/lib/paths";

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toTitleCase(raw) {
  const text = toText(raw)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!text) {
    return "Local service";
  }

  return text
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeCity(value) {
  return toText(value).toLowerCase();
}

function firstProviderService(providerId) {
  const providerService = listServicesForProvider(providerId)[0] ?? null;
  if (!providerService) return null;

  const service = getServiceById(providerService.serviceId);
  return service
    ? { providerService, service }
    : { providerService, service: null };
}

function formatLocationText(provider) {
  const city = provider.primaryCityName ?? null;
  const state = provider.primaryRegionCode ?? null;
  const country = provider.primaryCountryCode ?? null;

  if (city && state && country) return `${city}, ${state}, ${country}`;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (provider.locationText) return provider.locationText;
  return country;
}

function buildHomepageProviderCard(provider) {
  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) return null;

  const stats = getProviderStats(provider.id);
  const serviceLink = firstProviderService(provider.id);
  const service = serviceLink?.service ?? null;
  const categoryKey = service?.slug ?? provider.businessType ?? provider.categoryKey ?? null;
  const category = service?.name ?? toTitleCase(categoryKey);

  return {
    id: provider.id,
    actorId: provider.vcsmActorId ?? null,
    profileId: provider.id,
    slug: provider.slug,
    name: provider.displayName,
    category,
    categoryKey,
    city: provider.primaryCityName ?? null,
    stateCode: provider.primaryRegionCode ?? null,
    primaryCityName: provider.primaryCityName ?? null,
    primaryRegionCode: provider.primaryRegionCode ?? null,
    primaryCountryCode: provider.primaryCountryCode,
    countrySlug: country.slug,
    countryName: country.name,
    countryNameEs: country.nameEs ?? country.name,
    locationText: formatLocationText(provider),
    avatarUrl: provider.avatarUrl ?? null,
    bannerUrl: provider.bannerUrl ?? null,
    logoUrl: provider.logoUrl ?? null,
    rating: stats?.ratingAvg ?? null,
    reviewCount: stats?.reviewCount ?? null,
    responseTimeMinutes: stats?.responseTimeP50Minutes ?? null,
    responseTimeLabel: null,
    nextAvailableLabel: null,
    phone: provider.phoneE164 ?? null,
    phoneNumber: provider.phoneE164 ?? null,
    bookingUrl: provider.bookingUrl ?? null,
    verified: provider.source === "vport" || provider.claimStatus === "claimed",
    href: countryProviderPath(country.slug, provider.slug),
    source: provider.source,
    rankScore: stats?.rankScore ?? 0
  };
}

function selectProvidersForHomepage({ liveCards, defaultCityName }) {
  if (!liveCards.length) {
    return {
      cards: [],
      locationMode: "global"
    };
  }

  const normalizedDefaultCity = normalizeCity(defaultCityName);

  const cityMatched = normalizedDefaultCity
    ? liveCards.filter((card) => normalizeCity(card.city) === normalizedDefaultCity)
    : [];

  if (cityMatched.length) {
    return {
      cards: cityMatched,
      locationMode: "nearby"
    };
  }

  return {
    cards: liveCards,
    locationMode: "global"
  };
}

function buildHomepageStats(liveProviderCards) {
  if (!liveProviderCards.length) return [];

  const categoryCount = new Set(
    liveProviderCards
      .map((card) => toText(card.categoryKey).toLowerCase())
      .filter(Boolean)
  ).size;

  const citiesCount = new Set(
    liveProviderCards
      .map((card) => normalizeCity(card.city))
      .filter(Boolean)
  ).size;

  return [
    {
      label: "Active profiles",
      labelEs: "Perfiles activos",
      value: String(liveProviderCards.length)
    },
    ...(categoryCount > 0
      ? [{
          label: "Active categories",
          labelEs: "Categorias activas",
          value: String(categoryCount)
        }]
      : []),
    ...(citiesCount > 0
      ? [{
          label: "Active cities",
          labelEs: "Ciudades activas",
          value: String(citiesCount)
        }]
      : [])
  ];
}

export async function getHomepageLiveDirectoryData({
  defaultCitySlug = null,
  countryCode = null,
  providerLimit = 8
} = {}) {
  const defaultCity = defaultCitySlug ? (getCityBySlug(defaultCitySlug) ?? null) : null;
  const defaultCountry = defaultCity ? getCountryById(defaultCity.countryId) : null;
  const scopedCountryCode = countryCode ?? defaultCountry?.code ?? null;

  const liveProviderCards = listProviders({ countryCode: scopedCountryCode })
    .map(buildHomepageProviderCard)
    .filter(Boolean)
    .sort((left, right) => Number(right.rankScore ?? 0) - Number(left.rankScore ?? 0));

  const selectedLive = selectProvidersForHomepage({
    liveCards: liveProviderCards,
    defaultCityName: defaultCity?.name ?? null
  });

  return {
    providers: selectedLive.cards.slice(0, providerLimit),
    stats: buildHomepageStats(liveProviderCards),
    categories: [],
    locationMode: selectedLive.locationMode,
    hasLiveProviders: liveProviderCards.length > 0,
    liveProviderCount: liveProviderCards.length,
    status: {
      profiles: liveProviderCards.length > 0,
      profilePublicDetails: false,
      profileCategories: false,
      categories: false,
      publicTrazeProfiles: liveProviderCards.length > 0
    }
  };
}

export function groupProvidersByCountry(providers) {
  const order = [];
  const map = new Map();

  for (const provider of providers) {
    const code = String(provider.primaryCountryCode ?? "").toUpperCase();
    if (!code) continue;

    if (!map.has(code)) {
      order.push(code);
      map.set(code, {
        countryCode: code,
        countrySlug: provider.countrySlug ?? code.toLowerCase(),
        countryName: provider.countryName ?? code,
        countryNameEs: provider.countryNameEs ?? provider.countryName ?? code,
        providers: [],
        citySlugs: new Set(),
        categoryKeys: new Set()
      });
    }

    const group = map.get(code);
    group.providers.push(provider);
    if (provider.primaryCitySlug ?? provider.city) {
      group.citySlugs.add(String(provider.primaryCitySlug ?? provider.city).toLowerCase());
    }
    if (provider.categoryKey) {
      group.categoryKeys.add(String(provider.categoryKey).toLowerCase());
    }
  }

  return order.map((code) => {
    const g = map.get(code);
    return {
      countryCode: g.countryCode,
      countrySlug: g.countrySlug,
      countryName: g.countryName,
      countryNameEs: g.countryNameEs,
      providerCount: g.providers.length,
      cityCount: g.citySlugs.size,
      serviceCount: g.categoryKeys.size,
      providers: g.providers
    };
  });
}

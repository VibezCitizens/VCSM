import { fetchVportHomepageRows } from "@/data/connectors/vportHomepage.connector";
import { getCityBySlug, listCities } from "@/data/repositories/city.repo";
import { getCountryByCode, getCountryById } from "@/data/repositories/geo.repo";
import { countryCityServicePath, countryProviderPath } from "@/lib/paths";
import { normalizeSlug } from "@/lib/slugs";

const FALLBACK_CATEGORIES = [
  {
    id: "barbers",
    label: "Barbers",
    blurb: "Haircuts, fades, and beard trims.",
    href: "/us/san-francisco/barber",
    status: "Live"
  },
  {
    id: "locksmiths",
    label: "Locksmiths",
    blurb: "Lockouts, rekey, and key replacement.",
    href: "/us/san-francisco/locksmith",
    status: "Live"
  },
  {
    id: "restaurants",
    label: "Restaurants",
    blurb: "Dining listings and booking slots.",
    href: null,
    status: "Launching"
  },
  {
    id: "gas-stations",
    label: "Gas Stations",
    blurb: "Nearby stations and service info.",
    href: null,
    status: "Launching"
  },
  {
    id: "money-exchange",
    label: "Money Exchange",
    blurb: "Exchange points by city.",
    href: null,
    status: "Launching"
  }
];

const KEY_TO_ROUTE_SERVICE = {
  barber: "barber",
  hairstylist: "barber",
  barbershop: "barber",
  esthetician: "barber",
  locksmith: "locksmith"
};

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toAddressObject(address) {
  if (!address) {
    return {};
  }

  if (typeof address === "string") {
    try {
      const parsed = JSON.parse(address);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }

    return {};
  }

  if (typeof address === "object" && !Array.isArray(address)) {
    return address;
  }

  return {};
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

function pickCountryCode(address, fallback = "US") {
  const raw = toText(
    address.country_code ?? address.countryCode ?? address.iso2 ?? address.country
  ).toUpperCase();

  if (/^[A-Z]{2}$/.test(raw)) {
    return raw;
  }

  return fallback;
}

function categoryLabelForKey(categoryKey, categoryMap) {
  const key = toText(categoryKey).toLowerCase();
  if (!key) {
    return "Local service";
  }

  const liveLabel = categoryMap.get(key);
  if (liveLabel) {
    return liveLabel;
  }

  return toTitleCase(key);
}

function buildLiveCategoryMap(categoryRows) {
  const map = new Map();

  categoryRows.forEach((row) => {
    const key = toText(row?.key).toLowerCase();
    if (!key) {
      return;
    }

    const label = toText(row?.label) || toTitleCase(key);
    map.set(key, label);
  });

  return map;
}

function buildLiveProviderCards({
  profiles,
  profileCategories,
  publicTrazeProfiles,
  categoryMap,
  defaultCountrySlug
}) {
  const primaryCategoryByProfileId = new Map(
    profileCategories
      .filter((row) => row?.is_primary === true)
      .map((row) => [String(row.profile_id), toText(row.category_key).toLowerCase()])
  );

  const trazeViewByProfileId = new Map(
    publicTrazeProfiles.map((row) => [String(row.id), row])
  );

  const profileLikeRows = profiles.length > 0 ? profiles : publicTrazeProfiles;

  return profileLikeRows
    .map((profile) => {
      const profileId = String(profile?.id ?? "").trim();
      const trazeViewRow = trazeViewByProfileId.get(profileId) ?? profile;

      const slug = normalizeSlug(profile?.slug ?? trazeViewRow?.slug);
      const actorId = toText(profile?.actor_id ?? trazeViewRow?.actor_id) || null;

      if (!profileId || !slug) {
        return null;
      }

      const address = toAddressObject(trazeViewRow?.address);
      const locationText = toText(trazeViewRow?.location_text) || null;
      const city = toText(trazeViewRow?.city) || null;
      const stateCode = toText(trazeViewRow?.state_code).toUpperCase() || null;

      const countryCode = pickCountryCode(
        {
          ...address,
          country_code: trazeViewRow?.city_country_code ?? trazeViewRow?.country_code ?? address.country_code,
          country: address.country
        },
        "US"
      );

      const country = getCountryByCode(countryCode);
      const countrySlug = country?.slug ?? defaultCountrySlug;

      const categoryFromPrimary = primaryCategoryByProfileId.get(profileId);
      const categoryFromView = toText(trazeViewRow?.category_key).toLowerCase();
      const categoryKey = categoryFromPrimary ?? (categoryFromView || null);
      const category = categoryLabelForKey(categoryKey, categoryMap);

      const locationLabel = city
        ? (stateCode ? (city + ", " + stateCode) : city)
        : (locationText ?? null);

      return {
        id: profileId,
        actorId,
        profileId,
        slug,
        name: toText(profile?.name ?? trazeViewRow?.name) || slug,
        category,
        categoryKey,
        city,
        stateCode,
        primaryCityName: city,
        primaryRegionCode: stateCode,
        locationText: locationLabel,
        avatarUrl: toText(profile?.avatar_url ?? trazeViewRow?.avatar_url) || null,
        bannerUrl: toText(profile?.banner_url ?? trazeViewRow?.banner_url) || null,
        rating: null,
        reviewCount: null,
        responseTimeLabel: null,
        nextAvailableLabel: null,
        verified: false,
        href: countryProviderPath(countrySlug, slug),
        source: "live"
      };
    })
    .filter(Boolean);
}

function normalizeCity(value) {
  return toText(value).toLowerCase();
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

function buildHomepageStats({ liveProfiles, liveProviderCards, status }) {
  const stats = [];

  if (!status.profiles && !status.publicTrazeProfiles) {
    return stats;
  }

  const activeVports = liveProviderCards.length > 0 ? liveProviderCards.length : liveProfiles.length;

  if (activeVports <= 0) {
    return stats;
  }

  stats.push({
    label: "Active Vports",
    labelEs: "Vports activos",
    value: String(activeVports)
  });

  if (status.publicTrazeProfiles || status.profileCategories) {
    const categoryCount = new Set(
      liveProviderCards
        .map((card) => toText(card.categoryKey).toLowerCase())
        .filter(Boolean)
    ).size;

    if (categoryCount > 0) {
      stats.push({
        label: "Active categories",
        labelEs: "Categorías activas",
        value: String(categoryCount)
      });
    }
  }

  if (status.publicTrazeProfiles || status.profilePublicDetails) {
    const citiesCount = new Set(
      liveProviderCards
        .map((card) => normalizeCity(card.city))
        .filter(Boolean)
    ).size;

    if (citiesCount > 0) {
      stats.push({
        label: "Active cities",
        labelEs: "Ciudades activas",
        value: String(citiesCount)
      });
    }
  }

  return stats;
}

function buildHomepageCategories({ categoryRows, defaultCountrySlug, defaultCitySlug }) {
  const activeRows = categoryRows
    .filter((row) => row?.is_active !== false)
    .filter((row) => toText(row?.key))
    .slice(0, 8);

  if (!activeRows.length) {
    return FALLBACK_CATEGORIES;
  }

  return activeRows.map((row) => {
    const key = toText(row.key).toLowerCase();
    const label = toText(row.label) || toTitleCase(key);

    const liveServiceSlug = KEY_TO_ROUTE_SERVICE[key] ?? null;

    return {
      id: key,
      label,
      blurb: `Browse ${label.toLowerCase()} listings.`,
      href: liveServiceSlug
        ? countryCityServicePath(defaultCountrySlug, defaultCitySlug, liveServiceSlug)
        : null,
      status: liveServiceSlug ? "Live" : "Launching"
    };
  });
}

export async function getHomepageLiveDirectoryData({
  defaultCitySlug = "miami",
  providerLimit = 8
} = {}) {
  const cities = listCities();
  const defaultCity = getCityBySlug(defaultCitySlug) ?? cities[0] ?? null;
  const defaultCountry = defaultCity ? getCountryById(defaultCity.countryId) : null;

  const defaultCountrySlug = defaultCountry?.slug ?? "us";
  const defaultCityName = defaultCity?.name ?? null;

  const liveRows = await fetchVportHomepageRows();
  const categoryMap = buildLiveCategoryMap(liveRows.categories);

  const liveProviderCards = buildLiveProviderCards({
    profiles: liveRows.profiles,
    profileCategories: liveRows.profileCategories,
    publicTrazeProfiles: liveRows.publicTrazeProfiles,
    categoryMap,
    defaultCountrySlug
  });

  const selectedLive = selectProvidersForHomepage({
    liveCards: liveProviderCards,
    defaultCityName
  });

  const providers = selectedLive.cards.slice(0, providerLimit);
  const stats = buildHomepageStats({
    liveProfiles: liveRows.profiles,
    liveProviderCards,
    status: liveRows.status
  });

  const categories = buildHomepageCategories({
    categoryRows: liveRows.categories,
    defaultCountrySlug,
    defaultCitySlug: defaultCity?.slug ?? defaultCitySlug
  });

  return {
    providers,
    stats,
    categories,
    locationMode: selectedLive.locationMode,
    hasLiveProviders: liveProviderCards.length > 0,
    liveProviderCount: liveProviderCards.length,
    status: liveRows.status
  };
}

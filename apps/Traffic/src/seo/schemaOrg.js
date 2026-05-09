import { buildCanonical } from "@/seo/canonical";

export function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? buildCanonical(item.href) : undefined
    }))
  };
}

export function buildDirectoryItemListSchema(args) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: args.name,
    url: buildCanonical(args.path),
    numberOfItems: args.providers.length,
    itemListElement: args.providers.map((item, index) => {
      const providerPath = args.resolveProviderPath
        ? args.resolveProviderPath(item.provider)
        : `/pro/${item.provider.slug}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "LocalBusiness",
          name: item.provider.displayName,
          url: buildCanonical(providerPath),
          telephone: item.provider.phoneE164 ?? undefined,
          image: item.provider.logoUrl ?? item.provider.avatarUrl ?? item.provider.bannerUrl ?? undefined,
          sameAs: compactUrls([
            item.provider.websiteUrl,
            item.provider.googleMapsUrl,
            item.provider.instagramUrl,
            item.provider.facebookUrl
          ]),
          geo: buildGeoSchema(item.provider.lat, item.provider.lng),
          address: {
            "@type": "PostalAddress",
            streetAddress: item.provider.addressLine1 ?? undefined,
            postalCode: item.provider.postalCode ?? undefined,
            addressLocality: args.cityName,
            addressCountry: item.provider.primaryCountryCode
          },
          areaServed: [args.cityName, args.countryName].filter(Boolean),
          aggregateRating:
            item.stats && item.stats.reviewCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: item.stats.ratingAvg,
                  reviewCount: item.stats.reviewCount
                }
              : undefined
        }
      };
    })
  };
}

export function buildProviderSchema(args) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: args.providerName,
    description: args.description,
    url: buildCanonical(args.providerPath),
    telephone: args.telephone ?? undefined,
    image: args.image ?? undefined,
    sameAs: compactUrls(args.sameAs),
    geo: buildGeoSchema(args.lat, args.lng),
    openingHoursSpecification: buildOpeningHoursSpecification(args.hours),
    address: {
      "@type": "PostalAddress",
      streetAddress: args.addressLine1 ?? undefined,
      postalCode: args.postalCode ?? undefined,
      addressLocality: args.cityName ?? undefined,
      addressRegion: args.regionName ?? undefined,
      addressCountry: args.countryCode ?? undefined
    },
    areaServed: [args.localityName, args.cityName, args.countryName].filter(Boolean),
    aggregateRating:
      args.ratingAvg && args.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: args.ratingAvg,
            reviewCount: args.reviewCount
          }
      : undefined
  };
}

function compactUrls(urls = []) {
  const entries = Array.isArray(urls) ? urls : [urls];
  const clean = entries
    .map((url) => String(url ?? "").trim())
    .filter((url) => /^https?:\/\//i.test(url));
  return clean.length ? clean : undefined;
}

function buildGeoSchema(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return undefined;
  }

  return {
    "@type": "GeoCoordinates",
    latitude,
    longitude
  };
}

function buildOpeningHoursSpecification(hours) {
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) {
    return undefined;
  }

  const dayMap = {
    monday: "Monday",
    mon: "Monday",
    tuesday: "Tuesday",
    tue: "Tuesday",
    wednesday: "Wednesday",
    wed: "Wednesday",
    thursday: "Thursday",
    thu: "Thursday",
    friday: "Friday",
    fri: "Friday",
    saturday: "Saturday",
    sat: "Saturday",
    sunday: "Sunday",
    sun: "Sunday"
  };

  const specs = Object.entries(hours)
    .map(([dayKey, value]) => {
      if (!value || typeof value !== "object" || value.closed) return null;
      const opens = value.open ?? value.opens ?? value.start;
      const closes = value.close ?? value.closes ?? value.end;
      const dayOfWeek = dayMap[String(dayKey).toLowerCase()];
      if (!dayOfWeek || !opens || !closes) return null;
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek,
        opens,
        closes
      };
    })
    .filter(Boolean);

  return specs.length ? specs : undefined;
}

export function buildArticleSchema(args) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.title,
    description: args.description,
    articleSection: args.category ?? undefined,
    datePublished: args.publishedAt ?? undefined,
    dateModified: args.updatedAt ?? args.publishedAt ?? undefined,
    url: buildCanonical(args.path),
    author:
      args.authorName || args.authorUrl
        ? {
            "@type": "Organization",
            name: args.authorName ?? undefined,
            url: args.authorUrl ? buildCanonical(args.authorUrl) : undefined
          }
        : undefined,
    publisher:
      args.publisherName || args.publisherUrl
        ? {
            "@type": "Organization",
            name: args.publisherName ?? undefined,
            url: args.publisherUrl ? buildCanonical(args.publisherUrl) : undefined
          }
        : undefined,
    about: (args.about ?? []).filter(Boolean)
  };
}

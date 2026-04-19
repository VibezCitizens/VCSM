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

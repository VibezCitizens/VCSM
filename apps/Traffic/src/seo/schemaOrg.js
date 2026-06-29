import { buildCanonical } from "@/seo/canonical";
import { getSiteOrigin } from "@/lib/env";

const SITE_NAME = "Traze";

export function buildOrganizationSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: SITE_NAME,
    url: origin
  };
}

export function buildWebSiteSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: SITE_NAME,
    url: origin,
    publisher: {
      "@id": `${origin}/#organization`
    }
  };
}

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

// Canonical QAPage builder (TICKET-TRAZE-SEO-QAPAGE-001). Single source of truth
// for QAPage JSON-LD across both answer routes (build-time SEO answer pages and
// community published questions), replacing two divergent emitters.
//
// Input is a normalized shape:
//   question: { name, text, url, dateCreated?, dateModified?, datePublished? }
//   answers:  [{ text, url?, dateCreated?, datePublished?, authorName?, isAccepted? }]
//
// Returns null when there are no answers with text, so an answerless QAPage is
// never emitted (Google flags those as incomplete).
const QA_ORG_AUTHOR_NAME = "TRAZE";

function buildAnswerAuthor(authorName) {
  const name = String(authorName ?? "").trim();
  // The platform's generic fallback name represents the organization, not a
  // person — emit Organization to avoid a Person/identity mismatch.
  if (!name || name === QA_ORG_AUTHOR_NAME) {
    return { "@type": "Organization", name: QA_ORG_AUTHOR_NAME, url: getSiteOrigin() };
  }
  // Person name only. The source expert_profile_slug is unreliable (often a
  // display name with spaces, not a slug), so building a /pro/ URL produced
  // invalid, non-resolving links — omit it rather than emit a broken URL.
  return { "@type": "Person", name };
}

function buildQAAnswerNode(answer) {
  return {
    "@type": "Answer",
    text: answer.text,
    ...(answer.dateCreated ? { dateCreated: answer.dateCreated } : {}),
    ...(answer.datePublished ? { datePublished: answer.datePublished } : {}),
    ...(answer.url ? { url: answer.url } : {}),
    author: buildAnswerAuthor(answer.authorName)
  };
}

export function buildQAPageSchema({ question, answers = [] } = {}) {
  if (!question?.name) return null;

  const published = (answers ?? []).filter((answer) => answer && answer.text);
  if (!published.length) return null;

  const accepted = published.find((answer) => answer.isAccepted) ?? null;
  const suggested = published.filter((answer) => answer !== accepted);

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: question.name,
      text: question.text || question.name,
      ...(question.dateCreated ? { dateCreated: question.dateCreated } : {}),
      ...(question.dateModified ? { dateModified: question.dateModified } : {}),
      ...(question.datePublished ? { datePublished: question.datePublished } : {}),
      url: question.url,
      answerCount: published.length,
      ...(accepted ? { acceptedAnswer: buildQAAnswerNode(accepted) } : {}),
      ...(suggested.length ? { suggestedAnswer: suggested.map(buildQAAnswerNode) } : {})
    }
  };
}

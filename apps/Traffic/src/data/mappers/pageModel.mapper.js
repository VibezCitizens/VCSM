/**
 * @typedef {Object} DirectoryPageModel
 * @property {string} title
 * @property {string} description
 * @property {string} itemName
 * @property {number} providerCount
 * @property {import("@/data/types").DirectoryProviderListItem[]} providers
 * @property {string|null} priceSummary
 */

/**
 * @typedef {Object} ProviderPageModel
 * @property {string} title
 * @property {string} description
 * @property {import("@/data/types").Provider} provider
 * @property {string[]} serviceNames
 */

function formatPrice(cents, currencyCode, locale = "en-US") {
  if (cents == null) {
    return null;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(cents / 100);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 0
    }).format(cents / 100);
  }
}

export function buildDirectoryPageModel(args) {
  const { priceAggregate } = args;
  const locale = args.locale ?? "en-US";

  const p25 = formatPrice(priceAggregate?.priceP25Cents ?? null, priceAggregate?.currencyCode ?? "USD", locale);
  const p50 = formatPrice(priceAggregate?.priceP50Cents ?? null, priceAggregate?.currencyCode ?? "USD", locale);
  const p75 = formatPrice(priceAggregate?.priceP75Cents ?? null, priceAggregate?.currencyCode ?? "USD", locale);

  let priceSummary = null;
  if (p25 && p50 && p75) {
    priceSummary = `Market range ${p25} - ${p75} · median ${p50}`;
  }

  return {
    title: args.title,
    description: args.description,
    itemName: args.itemName,
    providerCount: args.providers.length,
    providers: args.providers,
    priceSummary
  };
}

export function buildProviderPageModel(args) {
  const location = [args.cityName, args.countryName].filter(Boolean).join(", ");

  return {
    title: `${args.provider.displayName}${location ? ` in ${location}` : ""}`,
    description: `${args.provider.displayName} serves ${args.localityName || args.cityName}. Explore services, reputation signals, and continue booking on TRAZE.`,
    provider: args.provider,
    serviceNames: args.services.map((service) => service.name)
  };
}

import { buildCanonical } from "@/seo/canonical";
import { buildLocalizedAlternates, routeLocaleToOpenGraphLocale } from "@/seo/locale";

function normalizeLanguageAlternates(languageAlternates) {
  if (!languageAlternates) {
    return undefined;
  }

  const entries = Object.entries(languageAlternates)
    .filter(([, path]) => Boolean(path))
    .map(([locale, path]) => [locale, buildCanonical(path)]);

  return entries.length ? Object.fromEntries(entries) : undefined;
}

function baseMetadata(args) {
  const localizedAlternates = buildLocalizedAlternates(args.canonicalPath ?? args.path, {
    locale: args.routeLocale
  });
  const canonical = args.canonical
    ? buildCanonical(args.canonical)
    : localizedAlternates.canonical;
  const languages =
    normalizeLanguageAlternates(args.languageAlternates) ??
    localizedAlternates.languages;
  const robots = args.robots;
  const openGraphType = args.openGraphType ?? "website";
  const openGraphExtras = args.openGraphExtras ?? {};
  const twitterCard = args.twitterCard ?? "summary";
  const title = args.title || "TRAZE";
  const description =
    args.description || "Discover providers, guides, directories, and reviews on TRAZE.";

  return {
    title,
    description,
    ...(robots ? { robots } : {}),
    alternates: {
      canonical,
      ...(languages ? { languages } : {})
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: openGraphType,
      locale: args.openGraphLocale ?? routeLocaleToOpenGraphLocale(args.routeLocale, args.locale ?? "en_US"),
      siteName: args.siteName ?? "TRAZE",
      ...openGraphExtras
    },
    twitter: {
      card: twitterCard,
      title,
      description
    }
  };
}

export function buildDirectoryMetadata(args) {
  return baseMetadata(args);
}

export function buildProviderMetadata(args) {
  return baseMetadata(args);
}

export function buildContentMetadata(args) {
  return baseMetadata({
    ...args,
    openGraphType: "article",
    twitterCard: "summary_large_image",
    openGraphExtras: {
      ...(args.publishedTime ? { publishedTime: args.publishedTime } : {}),
      ...(args.modifiedTime ? { modifiedTime: args.modifiedTime } : {})
    }
  });
}

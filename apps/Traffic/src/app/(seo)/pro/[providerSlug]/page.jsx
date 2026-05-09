import { notFound, redirect } from "next/navigation";
import { getProviderBySlugAny } from "@/data/repositories/provider.repo";
import { getCountryByCode } from "@/data/repositories/geo.repo";
import { listAllActiveProviderStaticParams } from "@/data/repositories/staticParams.repo";
import { countryProviderPath } from "@/lib/paths";
import { buildLocalizedAlternates } from "@/seo/locale";

const REDIRECT_ROBOTS = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true }
};

export function generateStaticParams() {
  return listAllActiveProviderStaticParams();
}

export function generateMetadataForLocale({ params }, routeLocale = null) {
  const legacyPath = `/pro/${params.providerSlug}`;
  const alternates = buildLocalizedAlternates(legacyPath, { locale: routeLocale });

  return {
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages
    },
    robots: REDIRECT_ROBOTS
  };
}

export function generateMetadata(args) {
  return generateMetadataForLocale(args);
}

export default function LegacyProviderRedirectPage({ params }) {
  const provider = getProviderBySlugAny(params.providerSlug);
  if (!provider) notFound();

  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) notFound();

  redirect(countryProviderPath(country.slug, provider.slug));
}

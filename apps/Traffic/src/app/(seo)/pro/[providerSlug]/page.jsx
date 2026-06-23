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
  const live = listAllActiveProviderStaticParams();
  if (live.length > 0) return live;
  // Taxonomy fallback: no live providers at build time. Placeholder renders notFound()
  // at static generation time so the route is included in the export.
  return [{ providerSlug: "no-providers" }];
}

export async function generateMetadataForLocale({ params }, routeLocale = null) {
  const resolvedParams = await params;
  const legacyPath = `/pro/${resolvedParams.providerSlug}`;
  const alternates = buildLocalizedAlternates(legacyPath, { locale: routeLocale });

  return {
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages
    },
    robots: REDIRECT_ROBOTS
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return generateMetadataForLocale({ params: resolvedParams });
}

export default async function LegacyProviderRedirectPage({ params }) {
  const { providerSlug } = await params;
  const provider = getProviderBySlugAny(providerSlug);
  if (!provider) notFound();

  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) notFound();

  redirect(countryProviderPath(country.slug, provider.slug));
}

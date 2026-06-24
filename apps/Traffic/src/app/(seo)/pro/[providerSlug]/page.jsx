import { notFound } from "next/navigation";
import { getProviderBySlugAny } from "@/data/repositories/provider.repo";
import { getCountryByCode } from "@/data/repositories/geo.repo";
import { listAllActiveProviderStaticParams } from "@/data/repositories/staticParams.repo";
import { countryProviderPath } from "@/lib/paths";
import { buildCanonical } from "@/seo/canonical";
import LegacyProviderRedirect from "./LegacyProviderRedirect";

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

function resolveCanonicalProviderPath(providerSlug) {
  const provider = getProviderBySlugAny(providerSlug);
  if (!provider) return null;

  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) return null;

  return countryProviderPath(country.slug, provider.slug);
}

// Static-export note (TICKET-TRAZE-SEO-REMEDIATION-001): redirect() from
// next/navigation is a request-time behavior and is a no-op under
// output:"export" — it previously emitted a blank page that self-canonicalized to
// the legacy URL. Legacy /pro/<slug> URLs are now consolidated to the canonical
// /<country>/pro/<slug> URL via rel=canonical + noindex (for crawlers) and a
// client-side location.replace (for human visitors). routeLocale is intentionally
// ignored because every locale variant consolidates to the same canonical URL.
export async function generateMetadataForLocale({ params }) {
  const resolvedParams = await params;
  const canonicalPath = resolveCanonicalProviderPath(resolvedParams.providerSlug);

  if (!canonicalPath) {
    return { robots: REDIRECT_ROBOTS };
  }

  return {
    alternates: { canonical: buildCanonical(canonicalPath) },
    robots: REDIRECT_ROBOTS
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return generateMetadataForLocale({ params: resolvedParams });
}

export default async function LegacyProviderRedirectPage({ params }) {
  const { providerSlug } = await params;
  const canonicalPath = resolveCanonicalProviderPath(providerSlug);
  if (!canonicalPath) notFound();

  return <LegacyProviderRedirect target={canonicalPath} />;
}

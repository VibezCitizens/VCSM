import { listLiveProviderCountries } from "@/data/repositories/provider.repo";
import { CountrySelectorClient } from "@/features/home/adapters/home.adapter";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { buildDirectoryMetadata } from "@/seo/metadata";

export function buildTopProvidersMetadata(routeLocale = null) {
  return buildDirectoryMetadata({
    title: "Top Service Providers | TRAZE",
    description: "Choose your country to browse top-rated service providers on TRAZE.",
    path: "/top-providers",
    routeLocale
  });
}

export const metadata = buildTopProvidersMetadata();

export default function TopProvidersPage() {
  const countries = listLiveProviderCountries();

  return (
    <TrazePageShell>
      <CountrySelectorClient countries={countries} destinationPath="top-providers" />
    </TrazePageShell>
  );
}

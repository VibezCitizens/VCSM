import { listLiveProviderCountries } from "@/data/repositories/provider.repo";
import CountrySelectorClient from "@/features/home/components/CountrySelectorClient";
import { TrazePageShell } from "@/shared/components/TrazePageShell";

export const metadata = {
  title: "Top Service Providers | TRAZE",
  description: "Choose your country to browse top-rated service providers on TRAZE.",
  alternates: { canonical: "/top-providers" }
};

export default function TopProvidersPage() {
  const countries = listLiveProviderCountries();

  return (
    <TrazePageShell>
      <CountrySelectorClient countries={countries} destinationPath="top-providers" />
    </TrazePageShell>
  );
}

import HomepageProviderCard from "@/features/home/components/HomepageProviderCard";
import { translate } from "@/i18n";

function buildCountryMeta(group, lang) {
  const parts = [];

  if (group.providerCount) {
    parts.push(`${group.providerCount} ${translate("common.providers", lang)}`);
  }
  if (group.cityCount) {
    parts.push(`${group.cityCount} ${translate("common.cities", lang).toLowerCase()}`);
  }
  if (group.serviceCount) {
    parts.push(`${group.serviceCount} ${translate("common.categories", lang)}`);
  }

  return parts.join(" · ");
}

export default function HomepageCountryGroup({ group, lang }) {
  if (!group?.providers?.length) return null;

  const countryName = lang === "es" ? group.countryNameEs : group.countryName;
  const metaLine = buildCountryMeta(group, lang);
  const visibleProviders = group.providers.slice(0, 3);

  return (
    <div className="hp-country-group">
      <div className="hp-country-header">
        <div className="hp-country-header-left">
          <span className="hp-country-code-badge">{group.countryCode}</span>
          <div>
            <h3 className="hp-country-name">{countryName}</h3>
            {metaLine && <p className="hp-country-meta">{metaLine}</p>}
          </div>
        </div>
      </div>

      <div className="hp-providers-row">
        {visibleProviders.map((provider) => (
          <HomepageProviderCard key={provider.id} provider={provider} lang={lang} />
        ))}
      </div>
    </div>
  );
}

import { DirectoryBreadcrumbs } from "@/features/directories/components/DirectoryBreadcrumbs";
import { InternalLinkGrid } from "@/features/directories/components/InternalLinkGrid";
import { ProviderListItem } from "@/features/directories/components/ProviderListItem";
import { DirectoryCtaModules } from "@/features/conversion/components/CtaModules";
import { getRelatedGuideLinksForContext } from "@/features/directories/lib/relatedGuides";
import { JsonLdScript } from "@/shared/components/JsonLdScript";

export async function DirectoryPageTemplate({
  breadcrumbs,
  model,
  context,
  relatedLinks,
  guideLinks = [],
  schema
}) {
  const contextGuideLinks = guideLinks.length
    ? guideLinks
    : await getRelatedGuideLinksForContext(context, { limit: 3 });

  return (
    <div className="stack-grid">
      <JsonLdScript id="directory-schema" schema={schema} />

      <section className="card stack-grid">
        <DirectoryBreadcrumbs items={breadcrumbs} />
        <h1 className="template-title">{model.title}</h1>
        <p>{model.description}</p>

        <div className="row-wrap">
          <span className="pill">{model.providerCount} providers</span>
          {model.priceSummary ? <span className="pill">{model.priceSummary}</span> : null}
        </div>
      </section>

      <section className="stack-grid">
        {model.providers.map((item) => (
          <ProviderListItem key={item.provider.id} item={item} />
        ))}
      </section>

      <InternalLinkGrid title="TRAZE Guides & Resources" links={contextGuideLinks} />
      <InternalLinkGrid title="Related TRAZE Discovery Pages" links={relatedLinks} />
      <DirectoryCtaModules context={context} />
    </div>
  );
}

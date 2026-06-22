# Traffic P0 Architecture Remediation Manifest

- Timestamp: 20260430-205704
- Repository: /Users/vcsm/Desktop/VCSM
- App: /Users/vcsm/Desktop/VCSM/apps/Traffic
- Git branch: main
- Backup path: /Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/zcontract/doc/backups/traffic-p0-architecture-remediation-20260430-205704
- Reason: P0 architecture remediation only. Remove Supabase access from ProviderLeadCaptureCard, move provider lead submission into conversion DAL/model/controller/hook layers, move vportDataset Supabase query into DAL with model-only flattening, and add conversion adapter.

## Files Changed / To Change
- apps/Traffic/src/features/conversion/components/ProviderLeadCaptureCard.jsx
- apps/Traffic/src/features/conversion/components/CtaModules.jsx
- apps/Traffic/src/data/connectors/vportDataset.js
- apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
- apps/Traffic/src/features/conversion/model/providerLead.model.js
- apps/Traffic/src/features/conversion/controller/submitProviderLead.controller.js
- apps/Traffic/src/features/conversion/hooks/useProviderLeadCapture.js
- apps/Traffic/src/features/conversion/adapters/conversion.adapter.js
- apps/Traffic/src/data/dal/vportDataset.read.dal.js
- apps/Traffic/src/data/mappers/vportDataset.model.js

## Existing Files Backed Up
- apps/Traffic/src/features/conversion/components/ProviderLeadCaptureCard.jsx
- apps/Traffic/src/features/conversion/components/CtaModules.jsx
- apps/Traffic/src/data/connectors/vportDataset.js

## New Files Without Prior Backup
- apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
- apps/Traffic/src/features/conversion/model/providerLead.model.js
- apps/Traffic/src/features/conversion/controller/submitProviderLead.controller.js
- apps/Traffic/src/features/conversion/hooks/useProviderLeadCapture.js
- apps/Traffic/src/features/conversion/adapters/conversion.adapter.js
- apps/Traffic/src/data/dal/vportDataset.read.dal.js
- apps/Traffic/src/data/mappers/vportDataset.model.js

## Git Status Before Changes
```text
 M apps/Traffic/next.config.mjs
 M apps/Traffic/package-lock.json
 M apps/Traffic/package.json
 M apps/Traffic/src/app/(seo)/[city]/[segment]/[service]/[detail]/[specialty]/page.jsx
 M apps/Traffic/src/app/(seo)/[city]/[segment]/[service]/[detail]/page.jsx
 M apps/Traffic/src/app/(seo)/[city]/[segment]/[service]/page.jsx
 M apps/Traffic/src/app/(seo)/[city]/[segment]/page.jsx
 M apps/Traffic/src/app/(seo)/[city]/page.jsx
 M apps/Traffic/src/app/(seo)/pro/[providerSlug]/page.jsx
 M apps/Traffic/src/app/globals.css
 M apps/Traffic/src/app/layout.jsx
 M apps/Traffic/src/app/page.jsx
 M apps/Traffic/src/data/connectors/mockDataset.js
 M apps/Traffic/src/data/connectors/unifiedDataset.js
 M apps/Traffic/src/data/connectors/vportDataset.js
 D apps/Traffic/src/data/mappers/pageModel.mapper.js
 D apps/Traffic/src/data/mappers/vportToProvider.mapper.js
 M apps/Traffic/src/data/repositories/city.repo.js
 M apps/Traffic/src/data/repositories/geo.repo.js
 M apps/Traffic/src/data/repositories/pageCandidate.repo.js
 M apps/Traffic/src/data/repositories/provider.repo.js
 M apps/Traffic/src/data/repositories/reviewSummary.repo.js
 M apps/Traffic/src/data/repositories/service.repo.js
 M apps/Traffic/src/data/types.js
 M apps/Traffic/src/features/conversion/components/CtaModules.jsx
 M apps/Traffic/src/features/directories/components/ProviderListItem.jsx
 M apps/Traffic/src/features/directories/templates/DirectoryPageTemplate.jsx
 M apps/Traffic/src/features/home/components/HomepageGuidesPreviewSection.jsx
 M apps/Traffic/src/features/home/components/HomepageLocationContext.jsx
 M apps/Traffic/src/features/home/components/HomepageQuickActions.jsx
 M apps/Traffic/src/features/home/components/HomepageSearchPanel.jsx
 M apps/Traffic/src/features/home/components/HomepageTopProvidersSection.jsx
 M apps/Traffic/src/features/home/components/HomepageTrendingSection.jsx
 M apps/Traffic/src/features/home/components/HomepageTrustStrip.jsx
 M apps/Traffic/src/features/providers/templates/ProviderPageTemplate.jsx
 M apps/Traffic/src/features/reviews/components/ReviewTrustSummary.jsx
 M apps/Traffic/src/shared/components/AppShell.jsx
?? apps/Traffic/src/app/(seo)/[city]/[segment]/[service]/_directoryRenderers.jsx
?? apps/Traffic/src/app/(seo)/[city]/[segment]/[service]/_graph.js
?? apps/Traffic/src/app/(seo)/[city]/[segment]/[service]/_providerRenderer.jsx
?? apps/Traffic/src/app/(seo)/[city]/[segment]/_graph.js
?? apps/Traffic/src/app/(seo)/[city]/[segment]/_renderers.jsx
?? apps/Traffic/src/app/(seo)/[city]/_graph.js
?? apps/Traffic/src/app/(seo)/[city]/_renderers.jsx
?? apps/Traffic/src/app/answers/
?? apps/Traffic/src/data/connectors/mockPriceAggregates.js
?? apps/Traffic/src/data/connectors/mockProviders.a.js
?? apps/Traffic/src/data/connectors/mockProviders.b.js
?? apps/Traffic/src/data/connectors/mockProviders.c.js
?? apps/Traffic/src/data/connectors/providerReviews.connector.js
?? apps/Traffic/src/data/connectors/taxonomyDataset.js
?? apps/Traffic/src/data/connectors/vportHomepage.connector.js
?? apps/Traffic/src/data/dal/providerProfile.read.dal.js
?? apps/Traffic/src/data/dal/vportHomepage.read.dal.js
?? apps/Traffic/src/data/mappers/pageModel.model.js
?? apps/Traffic/src/data/mappers/vportToProvider.model.js
?? apps/Traffic/src/data/repositories/homepage.repo.js
?? apps/Traffic/src/data/repositories/staticParams.repo.js
?? apps/Traffic/src/features/answers/
?? apps/Traffic/src/features/conversion/components/ProviderLeadCaptureCard.jsx
?? apps/Traffic/src/features/directories/components/DirectoryFilterRow.jsx
?? apps/Traffic/src/features/providers/components/ProviderReviewList.jsx
```

## Manifest Update Before Additional New File
- Added new file to preserve DAL import boundary for vportDataset compatibility export:
  - apps/Traffic/src/data/controllers/vportDataset.controller.js
- Existing backup impact: none. This file did not exist before creation.

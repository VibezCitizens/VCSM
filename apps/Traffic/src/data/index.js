/**
 * data/ PUBLIC BOUNDARY
 *
 * CONSUMERS:
 *   - App-layer RSC pages (app/**\/page.jsx, app/**\/_renderers.jsx) — direct import OK
 *   - Feature module DALs (features/*\/dal/) — re-export from here
 *
 * PROHIBITED:
 *   - Feature module internals (components, controllers, hooks, models, templates, lib)
 *     must NOT import from data/ directly — route through features/*\/dal/ instead
 *
 * LAYERS (inner-to-outer, consumers import the outermost layer they need):
 *   connectors/  — raw transport (Supabase client, dataset loaders) — private
 *   controllers/ — internal orchestration — private
 *   dal/         — async fetches from live APIs — app-layer OK
 *   repositories/ — sync reads from static taxonomy datasets — app-layer OK
 *   mappers/     — page model builders — app-layer OK
 */

// Repositories (sync, static-data)
export * from "@/data/repositories/aggregate.repo";
export * from "@/data/repositories/category.repo";
export * from "@/data/repositories/city.repo";
export * from "@/data/repositories/content.repo";
export * from "@/data/repositories/geo.repo";
export * from "@/data/repositories/geoCoverage.repo";
export * from "@/data/repositories/homepage.repo";
export * from "@/data/repositories/pageCandidate.repo";
export * from "@/data/repositories/provider.repo";
export * from "@/data/repositories/reviewSummary.repo";
export * from "@/data/repositories/service.repo";
export * from "@/data/repositories/staticParams.repo";
export * from "@/data/repositories/taxonomyParams.repo";

// DALs (async, live-data fetches)
export * from "@/data/dal/priceAggregate.read.dal";
export * from "@/data/dal/providerProfile.read.dal";
export * from "@/data/dal/publicContent.read.dal";
export * from "@/data/dal/trazeCategories.read.dal";
export * from "@/data/dal/vportDataset.read.dal";
export * from "@/data/dal/vportHomepage.read.dal";

// Mappers
export * from "@/data/mappers/pageModel.model";
export * from "@/data/mappers/providerIndex.model";

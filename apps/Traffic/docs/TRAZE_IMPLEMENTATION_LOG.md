# TRAZE Implementation Log (Traffic Public Layer)

This document summarizes the major implementation work completed in the Traffic app as it evolved into the TRAZE public discovery surface.

## 1) Public Content Distribution Layer

- Added read-only public content integration for VPORT content.
- Built DAL + connector + repository flow for public content consumption with safe fallbacks.
- Added standalone guide pages using canonical content data.
- Added homepage guide previews backed by repository data.
- Added related guides blocks on directory contexts.
- Integrated guide pages into static params + sitemap candidate flow.

Key outcomes:
- Traffic remains read-only.
- Content fetch failures fall back safely (no build hard-fail).
- Canonical guide pages became indexable SEO surfaces.

## 2) Canonical Guide URL Migration

- Implemented canonical guide route:
  - `/guides/[profileSlug]/[contentSlug]`
- Preserved backward compatibility:
  - Legacy slug-only guide URLs redirect to canonical provider-scoped URLs.
- Updated internal links (homepage, related guides, provider contexts) to canonical guide URLs.

Key outcomes:
- Reduced URL ambiguity.
- Provider-scoped guides now form the primary crawl target.

## 3) Internal Link Graph Strengthening

- Added/expanded provider ↔ guide ↔ directory linking:
  - Guide backlinks to provider and relevant directory pages.
  - Provider page “Guides & Resources” section.
  - Directory related guides with stronger provider context links.
  - Guide contextual navigation (“More from this provider”, service/city browse paths).

Key outcomes:
- Stronger crawl paths.
- Better user flow between discovery, trust, and conversion surfaces.

## 4) Public Review Trust Surfaces

- Added read-only public review summary integration.
- Introduced reusable trust summary component and rendered it across:
  - Provider pages
  - Guide provider context
  - Directory provider cards

Key outcomes:
- Trust signals (rating/count/badges) surfaced where users decide to click/book.
- Safe fallback to existing mock/provider stats when API summaries are unavailable.

## 5) TRAZE Branding Update (UI/Metadata)

- Updated user-facing branding references from Traffic/VCSM wording to TRAZE across:
  - Global shell branding
  - Homepage sections and CTA copy
  - Guide/provider/directory section labels
  - Empty/fallback guide messaging
  - Metadata defaults and OG site name fallback
  - Guide JSON-LD publisher naming

Constraints respected:
- No route renames.
- No API or data-layer contract renames.
- No import/path refactors.

## 6) ISR + On-Demand Revalidation (Current Phase)

### ISR TTLs

- Added page-level revalidation:
  - Guides: `3600s`
  - Service directories: `900s`
  - Specialty directories: `900s`
  - Provider pages: `900s`

### Revalidation API

- Added secure endpoint:
  - `POST /api/revalidate`
- Validates `x-revalidate-secret` against `REVALIDATE_SECRET`.
- Accepts payload:
  - `{ "paths": [...], "tags": [...] }`
- Applies:
  - `revalidatePath(path)`
  - `revalidateTag(tag)`

### Fetch Tagging

- Added lightweight fetch tagging in public content/review connectors.
- Supports tags such as:
  - `guide:{slug}`
  - `provider:{slug}`
  - `directory:{cityOrLocation}:{service}`

### Helper Client

- Added server helper for future integration:
  - `src/lib/revalidateClient.js`
- Sends signed POST to `/api/revalidate` with paths/tags payload.

### Cache Freshness Note

- Removed long-lived in-memory content/review summary caching that could outlive ISR windows.
- Freshness now relies on Next fetch cache + TTL/tags, so revalidate calls can take effect predictably.

## Operational Notes

- Required env var:
  - `REVALIDATE_SECRET`
- Typical trigger from VCSM:
  - Revalidate path(s) for canonical pages and matching tags for shared data.

Example:

```bash
curl -X POST https://traffic.vibezcitizens.com/api/revalidate \
  -H "x-revalidate-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"paths":["/us/pro/luna-cuts-sf"],"tags":["provider:luna-cuts-sf"]}'
```

## Current Architecture Status

- Traffic/TRAZE remains an isolated, read-only Next.js App Router surface.
- Content/review public integration is additive and resilient.
- Canonical routing and sitemap behavior remain intact.
- ISR + on-demand revalidation now provide controlled freshness without broad route rewrites.

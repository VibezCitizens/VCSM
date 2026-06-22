# TRAFFIC SEO METADATA FIX — CANONICAL, ROBOTS, JSON-LD

Date: 2026-05-03
Scope: Traffic (Next.js app)
Type: SEO / Rendering Correction
Status: Implemented

---

## 1. Problem Summary

Answer pages (`/answers/[slug]`) were rendering SEO-critical tags incorrectly:

- `<link rel="canonical">` was injected inside the body (JSX) instead of `<head>`
- `<meta name="robots">` was also rendered inside JSX
- JSON-LD schema used a hardcoded origin (`https://traze.vibezcitizens.com`)
- `robots.txt` was implemented via a custom route handler instead of Next.js metadata system

### Impact

- Google flagged pages as "Alternate page with proper canonical tag"
- Canonical signals were ignored or misinterpreted
- Environment portability was broken (hardcoded domain)

---

## 2. Root Cause

Improper use of SEO primitives:

| Element | Incorrect Implementation | Correct Approach |
|---|---|---|
| Canonical | JSX `<article>` body | `generateMetadata()` |
| Robots | JSX `<article>` body | `generateMetadata()` |
| JSON-LD URLs | Hardcoded origin | `getSiteOrigin()` |
| robots.txt | Route handler | `robots.js` metadata export |

---

## 3. Changes Implemented

### 3.1 Canonical + Metadata Fix

**File:** `src/app/answers/[slug]/page.jsx`

Added:

```js
export async function generateMetadata({ params }) {
  const result = await readAnswerPage({ slug: params.slug });
  const { seo } = result.page;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonicalUrl,   // resolved by model via getSiteOrigin()
    },
    robots: seo.isIndexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}
```

`seo.canonicalUrl` is built in `seoAnswerPage.model.js` using `getSiteOrigin()` — canonical generation stays in the model layer (single source of truth). Building it inline in `generateMetadata` would duplicate the path logic.

---

### 3.2 Removed Invalid JSX SEO Tags

**File:** `src/features/answers/screens/AnswerDetail.view.jsx`

Removed:

```jsx
<link rel="canonical" href={page.seo.canonicalUrl} />
<meta name="robots" content={page.seo.robotsContent} />
```

These now come exclusively from `generateMetadata()`.

---

### 3.3 JSON-LD Fix (Environment-Aware URLs)

**File:** `src/features/answers/components/AnswerSeoJsonLd.jsx`

Before:

```js
url: `https://traze.vibezcitizens.com/pro/${slug}`
```

After:

```js
import { getSiteOrigin } from "@/lib/env";

url: `${getSiteOrigin()}/pro/${slug}`
```

---

### 3.4 robots.txt Migration

**Removed:** `src/app/robots.txt/route.js` (custom route handler)

**Added:** `src/app/robots.js`

```js
import { getSiteOrigin } from "@/lib/env";

export default function robots() {
  const siteOrigin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteOrigin}/sitemap-index.xml`,
  };
}
```

---

## 4. Final Behavior

### Canonical

- Injected into `<head>` via Next.js metadata
- One canonical per page
- Fully environment-aware via `getSiteOrigin()`

### Robots

| Page State | Behavior |
|---|---|
| Published + has public answer | `index: true, follow: true` |
| Draft / pending / no answer | `index: false, follow: true` |

---

## 5. Routes Affected

### Fixed

- `/answers/[slug]`

### Already Correct (No Changes Needed at the time of this fix)

- `/[city]`
- `/[city]/[segment]`
- `/[city]/[segment]/[service]`
- `/[city]/[segment]/[service]/[detail]`
- `/[city]/[segment]/[service]/[detail]/[specialty]`
- `/pro/[providerSlug]` *(now redirect-only as of 2026-05-09 — see `traffic.vport.directory-integration.md`)*
- `/[city]/pro/[providerSlug]` *(canonical provider page, added 2026-05-09)*

All route levels use `generateMetadata()` + `buildCanonical()` + `getSiteOrigin()` correctly.

---

## 6. SEO Outcome

| Issue | Status |
|---|---|
| Canonical in body (invalid) | ✅ Fixed |
| Robots meta misplaced | ✅ Fixed |
| Hardcoded domain in JSON-LD | ✅ Fixed |
| robots.txt inconsistency | ✅ Fixed |

Expected result after crawl: drop in "Alternate page with proper canonical tag", stable indexing for answer pages, correct domain resolution across environments.

---

## 7. Known Consideration — Double Data Fetch

`readAnswerPage()` is called twice per build for each answer slug:

1. In `generateMetadata()`
2. In the async `AnswerDetailView` component

**Impact:** Negligible for static export (`output: "export"`). With `dynamicParams = false` and a small `generateStaticParams` list, the total call count is bounded at build time. If the DAL uses the Supabase JS client (not native `fetch`), Next.js cannot deduplicate these calls — two DB reads per page.

**Optimization (optional):** Introduce a `React.cache()` wrapper around `readAnswerPage` when the answers system goes live with real slugs at scale.

---

## 8. Summary

This fix aligns Traffic with correct Next.js SEO architecture:

- All SEO signals originate from the metadata API
- No SEO tags rendered in JSX body
- Domain is fully environment-driven via `getSiteOrigin()`
- `robots.txt` uses native Next.js export format

Resolves indexing instability and ensures scalable SEO correctness going forward.

# Vport Content Pages Pipeline

Updated: 2026-04-19
Codebase: `/Users/vcsm/Desktop/VCSM/apps/VCSM`
Target: vport / content tab

---

## 1. Overview

Content pages are rich text articles that vport owners publish under their profile. They appear in the "Content" tab (`VPORT_GAS_TABS`, `VPORT_RATES_TABS`, etc.) and serve SEO / educational purposes (guides, FAQs, emergency tips). Each page belongs to a single vport actor and is scoped to the `vport.content_pages` table.

Architecture follows: **DAL → Model → Controller → Hook → Screen**

---

## 2. Database Table

**Table:** `vport.content_pages`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| profile_id | uuid | FK → vport.profiles |
| actor_id | uuid | FK → vc.actors |
| title | text | Required, non-empty |
| slug | text | URL-safe, unique per profile, max 160 chars |
| excerpt | text | Optional short summary, max 500 chars |
| body | text | Full article body |
| category | text | `guide`, `faq`, `emergency`, `tips`, `educational` |
| service_keys | text[] | Related service keys |
| location_relevance | text | Optional geo hint, max 160 chars |
| seo_title | text | max 160 chars |
| seo_description | text | max 320 chars |
| is_published | boolean | Draft/published toggle |
| published_at | timestamptz | Set when published |
| is_indexable | boolean | SEO indexing flag |
| created_at / updated_at | timestamptz | — |

**Critical:** There is NO `summary` column and NO `cover_image_url` column. The short description field is `excerpt`. Any DAL or model referencing `summary` or `cover_image_url` will receive a Supabase column-not-found error.

---

## 3. File Map

| Layer | File | Role |
|-------|------|------|
| DAL (read) | `dal/content/listVportContentPages.dal.js` | Owner list — all pages (draft + published) |
| DAL (read) | `dal/content/listVportPublicContentPages.dal.js` | Public list — published only |
| DAL (read) | `dal/content/readVportContentPage.dal.js` | Single page by id (internal/owner) |
| DAL (read) | `dal/content/readVportPublicContentPage.dal.js` | Single page by id (public, published only) |
| DAL (write) | `dal/content/createVportContentPage.dal.js` | INSERT new page |
| DAL (write) | `dal/content/updateVportContentPage.dal.js` | UPDATE page by id |
| Model | `model/content/VportContentPage.model.js` | DB row → domain object |
| Controller | `controller/content/createVportContentPage.controller.js` | Validate + create |
| Controller | `controller/content/updateVportContentPage.controller.js` | Ownership check + patch |

---

## 4. Model Shape

```js
{
  id,
  actorId,
  profileId,
  title,
  slug,
  excerpt,        // maps from DB column "excerpt" (NOT "summary")
  body,
  category,
  serviceKeys,
  isPublished,
  isIndexable,
  publishedAt,
  createdAt,
  updatedAt,
}
```

---

## 5. Select Strings

All DAL files use explicit column selection (never `*`). Correct select strings:

**List DALs (no body):**
```
id,actor_id,profile_id,title,slug,excerpt,category,service_keys,is_published,is_indexable,published_at,created_at,updated_at
```

**Public list DAL (no body, no owner-only fields):**
```
id,actor_id,profile_id,title,slug,excerpt,category,service_keys,published_at,created_at
```

**Read/Create/Update DALs (full, includes body):**
```
id,actor_id,profile_id,title,slug,excerpt,body,category,service_keys,is_published,is_indexable,published_at,created_at,updated_at
```

---

## 6. Controllers

### createVportContentPage

- Validates: `actorId` required, `title` non-empty, `slug` format (lowercase, hyphens, max 160), `category` in allowed enum
- Resolves `profile_id` via `resolveProfileId(actorId)` (inner DAL query to `vport.profiles`)
- Inserts with `is_published: false`, `is_indexable: false` as safe defaults
- Returns mapped domain object

**Params:** `{ actorId, title, slug, excerpt, body, category, serviceKeys }`

### updateVportContentPage

- Validates: `actorId`, `id` required
- Ownership check: reads existing row, confirms `existing.actor_id === actorId`
- Builds patch object from provided fields only (undefined fields skipped)
- Allowed patch fields: `title`, `slug`, `excerpt`, `body`, `category`, `serviceKeys`
- Returns mapped domain object

---

## 7. Known Bug Fixed (2026-04-18)

**Error:** `column content_pages.summary does not exist`

**Root cause:** All DAL SELECT strings and the model referenced `summary` and `cover_image_url`, neither of which exist in the schema. The actual column is `excerpt`. There is no cover image column.

**Files corrected:**
- `model/content/VportContentPage.model.js` — `summary` → `excerpt`, removed `coverImageUrl`
- `dal/content/listVportContentPages.dal.js` — SELECT string
- `dal/content/listVportPublicContentPages.dal.js` — SELECT string
- `dal/content/readVportContentPage.dal.js` — SELECT string
- `dal/content/readVportPublicContentPage.dal.js` — SELECT string
- `dal/content/createVportContentPage.dal.js` — SELECT string + insert payload
- `dal/content/updateVportContentPage.dal.js` — SELECT string
- `controller/content/createVportContentPage.controller.js` — param name + DAL call
- `controller/content/updateVportContentPage.controller.js` — param name + patch assignment

---

## 8. Tab Registration

Content tab (`CONTENT`) is included in:
- `VPORT_GAS_TABS` — position 3 (after Gas, Services)
- `VPORT_RATES_TABS` — position 3 (after Rates, Services)
- `VPORT_SERVICE_TABS` — position 3
- `VPORT_BARBER_TABS` — position 5
- `VPORT_FOOD_TABS` — position 3

The Content tab is NOT in the generic `VPORT_TABS` fallback (general vport).

---

## 9. Template Picker (2026-04-19)

When an owner clicks **+ New Page**, a template picker step is shown before the form. The picker is type-aware — it shows business-type-specific templates first, then universal templates.

**Flow:**
1. Owner clicks "+ New Page" → `formState = { mode: 'create' }` + `selectedTemplate = TEMPLATE_PENDING` (Symbol sentinel)
2. `VportContentTemplatePicker` renders — shows template cards + "Start from blank" option
3. Selecting a template sets `selectedTemplate = templateObject`
4. "Start from blank" sets `selectedTemplate = null`
5. Once `selectedTemplate !== TEMPLATE_PENDING`, the form renders with `initialValues` pre-populated from the template (or empty for blank)
6. All pre-populated fields remain fully editable

**Template definition layer:** `screens/content/model/contentPageTemplates.js`
- `getTemplatesForVportType(vportType)` returns type-specific templates first, then universal
- Supported types: `barber`, `restaurant`, `gas`, `exchange`, `locksmith`
- Universal templates: About Us, FAQ, Tips for Customers, Why Choose Us

**Components:**
- `screens/content/components/VportContentTemplatePicker.jsx` — picker UI
- `screens/content/VportContentManageView.jsx` — orchestrates template step state
- `screens/content/VportContentView.jsx` — extracts `profile.vportType` and passes to ManageView

**`summary` → `excerpt` mapping (fixed 2026-04-19):**
The form uses "summary" as the UI label for the excerpt field. `VportContentManageView.handleSubmit` maps `{ summary, ...rest }` → `{ excerpt: summary, ...rest }` before calling the controller (which expects `excerpt`). This was a pre-existing silent bug where the excerpt was never saved on create/update.

**Edit mode initialization (fixed 2026-04-19):**
`VportContentPageForm` previously initialized the summary textarea from `page?.summary` (undefined). Fixed to `page?.excerpt`.

---

## 10. Public Content Visibility (2026-04-19)

### RLS Fix
`vport.content_pages` had no public SELECT policy. Non-owner users (anon + authenticated) received 0 rows silently even for published pages.

**Migration applied:** `zNOTFORPRODUCTION/db_snapshot/migrations/2026-04-19_content_pages_public_rls.sql`

```sql
CREATE POLICY content_pages_public_select
ON vport.content_pages
FOR SELECT
USING (is_published = true);
```

Only `is_published = true` rows are exposed. Draft pages remain private.

### Public DAL Cache
`dal/content/listVportPublicContentPages.dal.js` now caches results per `actorId` with a **5-minute TTL** using `createTTLCache`.

- Cache key: `pages:{actorId}`
- Invalidation: `invalidateVportPublicContentCache(actorId)` — called by `toggleVportContentPagePublishController` on every publish/unpublish action
- Second visit to the content tab within 5 minutes hits cache, zero network

---

## 11. Card and Viewer UI (2026-04-19)

### VportContentPageCard
- Category accent bar (left border, color-coded per category)
- Category color map: guide=purple, faq=sky, emergency=rose, tips=amber, educational=teal
- `page.excerpt` now displayed correctly (was incorrectly reading `page.summary`)
- "Read →" cue with hover color transition
- Single-column list layout (replaced auto-fill grid)

### VportContentPageViewer
- Modal is centered (`items-center`) with `rounded-3xl` on all corners
- `page.excerpt` now displayed correctly
- Body text rendered via `BodyText` component — parses `**bold**` markers, numbered lists, bullet lists, paragraph breaks
- Category label color-coded in header
- Position counter ("1 / 4") shown when multiple pages exist
- Prev/Next navigation at bottom — "Previous" / "Next" text buttons, shown only when adjacent page exists

### Publish Toggle
`VportContentOwnerRow` — "Draft" / "Live" status now renders as a proper toggle switch with a sliding white knob on a colored track (green when live, dim when draft), making the publish action self-evident.

---

## 12. Change Log

### 2026-04-19
- Added template picker feature (section 9): type-aware templates, TEMPLATE_PENDING sentinel pattern, summary→excerpt mapping fix, edit mode initialization fix
- Added public content RLS policy (section 10): content_pages_public_select allows anon/authenticated to read published pages
- Added public DAL cache (section 10): 5-min TTL, invalidated on publish/unpublish toggle
- Improved card and viewer UI (section 11): category color coding, excerpt fix, markdown body renderer, centered modal, prev/next navigation, publish toggle switch
- Files changed:
  - `screens/content/model/contentPageTemplates.js` (new)
  - `screens/content/components/VportContentTemplatePicker.jsx` (new)
  - `screens/content/components/VportContentPageForm.jsx` — initialValues prop, excerpt init fix
  - `screens/content/VportContentManageView.jsx` — template step, summary→excerpt mapping, vportType prop
  - `screens/content/VportContentView.jsx` — vportType extraction
  - `screens/content/components/VportContentPageCard.jsx` — category colors, excerpt fix, layout
  - `screens/content/components/VportContentPageViewer.jsx` — markdown renderer, navigation, centered modal
  - `screens/content/VportContentPublicView.jsx` — single-column layout, prev/next index tracking
  - `screens/content/components/VportContentOwnerRow.jsx` — toggle switch UI
  - `dal/content/listVportPublicContentPages.dal.js` — 5-min cache + invalidation export
  - `controller/content/toggleVportContentPagePublish.controller.js` — calls cache invalidation
  - `zNOTFORPRODUCTION/db_snapshot/migrations/2026-04-19_content_pages_public_rls.sql` (new)

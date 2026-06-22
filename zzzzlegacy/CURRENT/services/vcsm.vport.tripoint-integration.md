# VCSM VPORT — Tripoint Lock & Keys Integration

## 1. Purpose

Document how Tripoint Lock & Keys (tripointlockandkeys.com) operates as a standalone business website that consumes its data from a VCSM VPORT. This covers the current standalone state, the target VPORT consumer state, the migration path, and the database legacy that needs to be handled.

Tripoint is the **first reference implementation** of the external site integration pattern documented in `vcsm.vport.external-site-integration.md`.

## 2. Scope

- Tripoint's current standalone database tables (`public.tripoint_*`)
- Tripoint's target architecture as a VPORT consumer
- Data mapping from standalone tables to VCSM VPORT tables
- Migration path (reads first, writes later)
- What Tripoint keeps vs. what VCSM replaces

**Excluded:**
- Other VPORT consumer sites (documented in `vcsm.vport.external-site-integration.md`)
- Widget infrastructure (Option C — future)
- VCSM dashboard changes

## 3. Ownership

- **Application Scope:** VCSM + External (Tripoint site is outside this workspace)
- **Code Roots:** No Tripoint app code exists in this workspace
- **Related Engines:** `engines/portfolio/`, `engines/reviews/`, `engines/booking/`
- **Primary Features:** `features/profiles/kinds/vport/`
- **Database:** `public.tripoint_*` (legacy), `vc.vport_*` (target)

## 4. Current State — Standalone Tripoint

### Database Tables (public schema)

Tripoint currently has 3 standalone tables in the `public` schema, separate from all VCSM `vc.*` tables:

#### `public.tripoint_emails` (5 rows)

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | PK |
| `email` | citext | Subscriber email |
| `consent` | boolean | Email consent flag |
| `source_site` | text | Always `'TRIPOINT'` |
| `subscribed_at` | timestamptz | When subscribed |
| `ip_address` | inet | IP at signup |
| `user_agent` | text | Browser UA |
| `referred_by` | text | Referral source |
| `tags` | text[] | Subscriber tags |
| `notes` | text | Free-form notes |
| `vibez_user_id` | uuid | Link to VCSM user (nullable) |
| `welcome_ready` | boolean | Welcome email queued |
| `welcome_sent_at` | timestamptz | When welcome sent |
| `welcome_status` | text | Send status |
| `is_valid_email` | boolean (generated) | Regex validation |
| `lower_email` | text (generated) | Lowercase for dedup |

**RLS:** Anon insert requires `is_valid_email = true`, `consent = true`, `source_site = 'TRIPOINT'`.

#### `public.tripoint_reviews` (9 rows)

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | PK |
| `first_name` | text | Reviewer first name |
| `last_name` | text | Reviewer last name |
| `email` | text | Reviewer email |
| `rating` | integer | 1-5 star rating |
| `text` | text | Review body |
| `location` | text | Reviewer location |
| `source` | text | Where review came from |
| `source_url` | text | Original URL |
| `is_approved` | boolean | Moderation flag |
| `source_site` | text | Always `'TRIPOINT'` |
| `user_agent` | text | Browser UA |
| `lower_email` | text (generated) | Lowercase for dedup |

**RLS:** Public can read all. Public can insert with `rating 1-5`, `text >= 10 chars`, `is_approved` defaults false/null.
**Indexes:** `idx_tripoint_reviews_created` (created_at DESC), `idx_tripoint_reviews_lower_email`.
**Trigger:** `trg_tripoint_reviews_updated` fires `set_updated_at()` on update.

#### `public.tripoint_footer_clicks` (9 rows)

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | PK |
| `site` | text | Which site section |
| `clicked_at` | timestamptz | Click timestamp |
| `ip` | inet | Visitor IP |
| `city` | text | Geo city |
| `region` | text | Geo region |
| `country` | text | Geo country |
| `latitude` | float | Geo lat |
| `longitude` | float | Geo lng |
| `user_agent` | text | Browser UA |
| `referrer` | text | Referral source |

**RLS:** Anon + authenticated can insert and select.

### What Tripoint Currently Owns (Standalone)

| Feature | Current Source | Storage |
|---|---|---|
| Business name / logo | Hardcoded in site | Static files |
| Contact info / hours | Hardcoded in site | Static files |
| Services list | Hardcoded in site | Static files |
| Reviews | `public.tripoint_reviews` | Own table |
| Email capture | `public.tripoint_emails` | Own table |
| Analytics | `public.tripoint_footer_clicks` | Own table |
| Portfolio / work photos | None or static | N/A |
| Booking | None | N/A |
| Menu | N/A (locksmith) | N/A |

## 5. Target State — VPORT Consumer

After migration, Tripoint reads all business data from VCSM's VPORT tables while keeping its own domain, UI, and PWA shell.

### Data Source Mapping

| Feature | Current Source | Target Source |
|---|---|---|
| Business name | Hardcoded | `vc.vports` → `name`, `slug` |
| Logo / avatar | Static file | `vc.vports` → `avatar_url` |
| Banner | Static file | `vc.vports` → `banner_url` |
| Bio / description | Hardcoded | `vc.vports` → `bio` |
| Phone | Hardcoded | `vc.vport_public_details` → `phone_public` |
| Email | Hardcoded | `vc.vport_public_details` → `email_public` |
| Address | Hardcoded | `vc.vport_public_details` → `address`, `location_text` |
| Hours | Hardcoded | `vc.vport_public_details` → `hours` (jsonb) |
| Services | Hardcoded | `vc.vport_services` → `key`, `label`, `category` |
| Locksmith details | None | `vc.vport_locksmith_service_details` → `job_type`, `property_type`, `lock_type` |
| Service areas | None | `vc.vport_locksmith_service_areas` → coverage zones |
| Reviews | `public.tripoint_reviews` | `vc.vport_reviews` → `overall_rating`, `body`, `is_verified` |
| Portfolio | None | `vc.vport_portfolio_items` + `vc.vport_portfolio_media` |
| Locksmith portfolio | None | `vc.vport_locksmith_portfolio_details` |
| Booking | None | `vport.availability_rules` + computed slots |
| Email capture | `public.tripoint_emails` | Edge Function or keep standalone |
| Analytics | `public.tripoint_footer_clicks` | Keep standalone (site-specific) |

### What Tripoint Keeps After Migration

- Its own domain (tripointlockandkeys.com)
- Its own UI / branding / design
- Its own PWA shell
- Its own SEO / meta tags
- `public.tripoint_footer_clicks` (site analytics — not VCSM data)
- Optionally `public.tripoint_emails` (email list is site-specific)

### What Tripoint Stops Owning

- Business identity (name, logo, address, hours) — managed in VCSM dashboard
- Services catalog — managed in VCSM dashboard
- Reviews — unified in `vc.vport_reviews` (visible on VCSM app AND Tripoint site)
- Portfolio — managed in VCSM dashboard

## 6. Integration Method

**Recommended: Option B — Edge Function API** (see `vcsm.vport.external-site-integration.md`)

Tripoint calls clean REST endpoints that proxy VCSM Supabase reads:

```
GET /v1/vport/{actorId}/profile      → business identity + contact
GET /v1/vport/{actorId}/services     → locksmith service catalog
GET /v1/vport/{actorId}/portfolio    → work photos with locksmith details
GET /v1/vport/{actorId}/reviews      → customer reviews
GET /v1/vport/{actorId}/availability → booking slots
```

**Why not Option A (direct Supabase client)?**
- Exposes VCSM Supabase URL and anon key in Tripoint's client-side code
- No caching layer between Tripoint and VCSM database
- No rate limiting per external domain
- Reviews require auth — can't read with anon key alone

**Why not Option C (widgets)?**
- Widget infrastructure doesn't exist yet
- Tripoint wants full control over its UI/design
- Widgets would impose VCSM's styling on Tripoint's brand

## 7. Migration Path

### Phase 1 — Reads (No Breaking Changes)

1. Create Tripoint as a locksmith VPORT actor on VCSM
2. Fill in business identity, services, contact, hours via VCSM dashboard
3. Upload portfolio items (completed job photos with locksmith metadata)
4. Build Edge Function endpoints (or use Option A temporarily)
5. Replace Tripoint's hardcoded data with VCSM API reads
6. Keep `public.tripoint_reviews` as fallback during transition

### Phase 2 — Reviews Migration

1. Migrate existing 9 reviews from `public.tripoint_reviews` → `vc.vport_reviews`
2. Map fields: `first_name`+`last_name` → reviewer identity, `rating` → `overall_rating`, `text` → `body`
3. New reviews submitted on Tripoint → insert into `vc.vport_reviews` via Edge Function
4. Reviews now visible on both VCSM app and Tripoint site
5. Mark `public.tripoint_reviews` as archived (do not drop)

### Phase 3 — Booking Integration

1. Set up `vport.availability_rules` for Tripoint actor
2. Tripoint booking form → creates booking via Edge Function
3. Owner manages calendar from VCSM dashboard

### Phase 4 — Email / Lead Capture (Optional)

Options:
- Keep `public.tripoint_emails` as-is (site-specific lead list)
- OR create a VCSM lead/inquiry Edge Function that writes to a shared table
- Decision depends on whether the owner wants unified CRM or separate email lists

## 8. Review Field Mapping

| Tripoint Standalone (`public.tripoint_reviews`) | VCSM VPORT (`vc.vport_reviews`) |
|---|---|
| `first_name` + `last_name` | `reviewer_actor_id` (requires VCSM account) OR anonymous reviewer name |
| `email` | Not stored in review (tied to actor account) |
| `rating` (1-5) | `overall_rating` (1-5) |
| `text` | `body` |
| `location` | Not mapped (reviewer profile has location) |
| `source` | `source` or metadata |
| `is_approved` | `is_deleted` (inverse logic) + moderation pipeline |
| `source_site` | `platform` or metadata tag |

**Gap:** VCSM reviews use `reviewer_actor_id` which requires a VCSM account. For anonymous reviews from Tripoint site visitors, an Edge Function would need to handle anonymous submission — either creating a guest actor or storing reviewer name without actor linkage.

## 9. RLS Considerations

| Operation | Auth Required | Method |
|---|---|---|
| Read business profile | No (anon) | Direct or Edge Function |
| Read services | No (anon) | Direct or Edge Function |
| Read portfolio | No (anon via RPC) | Edge Function (uses `get_vport_portfolio` RPC) |
| Read reviews | Yes (auth required) | Edge Function with service role |
| Submit review | Yes (auth required) | Edge Function with customer identity |
| Create booking | Yes (auth required) | Edge Function with customer identity |
| Submit lead/email | Possible without auth | Edge Function (no auth needed) |

## 10. Tables to Preserve

| Table | Action | Reason |
|---|---|---|
| `public.tripoint_reviews` | Archive — do not drop | Historical data, migration reference |
| `public.tripoint_emails` | Keep active OR archive | Site-specific email list, may remain useful |
| `public.tripoint_footer_clicks` | Keep active | Site analytics, not VCSM data |

## 11. Benefits After Migration

1. **Single dashboard** — owner manages business on VCSM, sees changes on tripointlockandkeys.com
2. **Cross-platform reviews** — reviews visible on VCSM app AND Tripoint site
3. **Portfolio showcase** — upload work photos once, display on both platforms
4. **Consistent data** — hours, phone, services always in sync across all surfaces
5. **Booking integration** — one calendar, customers book from either platform
6. **Locksmith-specific features** — emergency flags, service areas, property types, all structured
7. **No duplicate database** — VCSM is the source of truth for business data
8. **SEO preserved** — Tripoint keeps its own domain, meta tags, sitemap

## 12. Files Map

| File | Role |
|---|---|
| `logan/vports/vcsm.vport.external-site-integration.md` | Parent spec — all VPORT consumer patterns |
| `logan/vports/vcsm.vport.locksmith-profile-spec.md` | Locksmith VPORT profile spec (Tripoint's type) |
| `logan/vports/vcsm.vport.review-pipeline-audit.md` | Review system audit |
| `db_snapshot/full_schema.sql` | Contains `public.tripoint_*` table definitions |
| `db_snapshot/all_rls_policies.csv` | RLS policies for tripoint tables |
| `db_snapshot/table_row_counts.csv` | Current row counts (5 emails, 9 reviews, 9 clicks) |

## 13. Change Log

### 2026-04-10 10:15 AM
- Task: Create Tripoint integration documentation
- Code Status Before: DOC MISSING — no dedicated Tripoint integration doc existed
- Summary: Created full integration document covering current standalone state (3 DB tables in public schema), target VPORT consumer architecture, data source mapping, 4-phase migration path, review field mapping, RLS considerations, and tables to preserve. Tripoint is the first reference implementation of the external site integration pattern.
- Files Changed:
  - Created: `logan/vports/vcsm.vport.tripoint-integration.md`
- Validation:
  - All 3 standalone Tripoint tables documented with column-level detail
  - Data mapping covers every field from standalone → VPORT
  - Migration path phased (reads → reviews → booking → email)
  - RLS auth requirements documented per operation

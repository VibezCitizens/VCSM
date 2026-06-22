# Locksmith Vport Profile + Dashboard Spec

## 1. Purpose

The locksmith vport is a service-provider profile for locksmiths, key specialists, and security hardware professionals. Locksmiths serve residential, automotive, and commercial customers — often in emergency situations with high urgency. Users visit a locksmith profile to check service coverage, verify availability, see past work, and request service. Speed, trust, and geographic coverage are the primary value drivers.

## 2. Public Profile Goal

Help a visitor decide whether to call this locksmith. Within 10 seconds of landing, the visitor should know:
- Whether this locksmith covers their area
- How fast they can arrive (ETA)
- What services they offer (lockout, rekey, install, smart lock, etc.)
- Whether emergency service is available
- What other customers say about trust and speed (reviews)
- What their past work looks like (portfolio)

## 3. Core Identity Block

- **Display name:** Business or personal brand name (e.g., "FastKey Locksmith", "Mike's Lock & Key")
- **Username / handle:** `@fastkey` — used in URLs, mentions, shares
- **Avatar / logo:** Square with `rounded-2xl`. Typically the business logo or technician photo. Must never be circular.
- **Banner:** Service vehicle, tools, storefront, or branded graphic. Gradient fallback if none set.
- **Headline / short descriptor:** Vport type label ("Locksmith") shown below display name
- **Location summary:** City + service area radius. Critical — locksmiths are location-dependent.
- **Contact / action buttons:**
  - Visitor: Message + Subscribe
  - Owner: QR code sharing
  - Emergency contact / call CTA should be prominent

## 4. Public Tabs

| Tab | Required | Purpose |
|-----|----------|---------|
| **Portfolio** | Yes | Showcase completed jobs — lock installs, rekeying, smart lock setups, before/after hardware. Landing tab for visual credibility. |
| **Book** | Yes | Booking/request calendar. Supports both scheduled and emergency request modes. |
| **Services** | Yes | Full service catalog: lockouts, rekeys, lock changes, smart lock installs, car key programming, safe opening, etc. |
| **Reviews** | Yes | Customer reviews with locksmith-specific dimensions (Speed Response, Problem Solved, Professionalism, Price Fairness, Trust & Safety). |
| **About** | Yes | Hours, service areas, coverage map, contact info, licensing, languages, payment methods. |
| **Photos** | Optional | All media posts — job photos, tool setups, team. |
| **Vibes** | Optional | Social feed posts (tips, promotions, seasonal alerts). |
| **Subscribers** | Optional | Public subscriber list. |

**Tab order:** Portfolio → Book → Services → Reviews → About → Photos → Vibes → Subscribers

## 5. Main Content Modules

### Portfolio
- Grid of completed job photos with square cards and `rounded-2xl` corners
- Each item shows locksmith-specific metadata:
  - Job type (lockout, rekey, new install, repair, smart lock, safe, car key, security upgrade)
  - Property type (residential, automotive, commercial, safe)
  - Lock type and hardware brand
  - Service mode (mobile, shop, onsite emergency, scheduled)
  - Emergency flag and security upgrade flag
  - Estimated duration
- Before/after pairs for hardware replacements and security upgrades
- Tag-based filtering (deadbolt, smart lock, car key, etc.)

### Booking / Request
- Supports both scheduled appointments and emergency requests
- Booking mode: `appointment` (scheduled) and `request` (ASAP/emergency)
- Service selection from catalog
- Property address or vehicle info collection when required
- ETA display based on service area coverage
- Emergency availability indicator

### Services
- Catalog grouped by service family: Residential, Automotive, Commercial, Emergency, Safe, Security
- Each service shows locksmith-specific detail metadata:
  - Emergency availability flag
  - Mobile service flag
  - After-hours availability
  - Pricing model (fixed, starting at, quote, inspection)
  - Starting price / price range
  - ETA range
  - Warranty days
  - Requirements (proof of ownership, photo ID, vehicle info, property address)
- Visitor mode: read-only with enriched metadata
- Owner mode: toggle services, edit locksmith detail per service

### Reviews
- Dimension ratings: Speed Response (1.40 weight), Problem Solved (1.50), Professionalism (1.20), Price Fairness (1.00), Trust & Safety (1.40)
- "Problem Solved" is the dominant signal — did the locksmith actually fix the issue?
- Trust & Safety is co-dominant — customers need confidence the locksmith is legitimate
- Emergency review context matters — speed response dimensions carry more weight in emergency jobs
- Overall average prominently displayed

### About
- Business hours with timezone
- **Service areas** — the most critical locksmith-specific section:
  - Cities, ZIP codes, or radius coverage
  - ETA per area (min–max minutes)
  - Emergency coverage flag per area
  - Travel fee per area
- Location with address and map link
- Licensing / certification info
- Languages spoken
- Payment methods
- Contact: phone, email, website

### Gallery / Photos
- Grid of all photo posts
- Job site photos, tool setups, vehicle/fleet photos
- Full-screen viewer with reactions

## 6. Reviews Behavior

**What customers care about most:**
- Did the locksmith solve the problem? (Problem Solved is the #1 dimension)
- Did they arrive fast enough? (critical for lockout situations)
- Were they professional and transparent about pricing?
- Did they feel safe letting this person access their property/vehicle?
- Was the price fair for the work done?

**Dimension weights (from DB seed):**
| Dimension | Weight | Sort |
|-----------|--------|------|
| Speed Response | 1.40 | 10 |
| Problem Solved | 1.50 | 20 |
| Professionalism | 1.20 | 30 |
| Price Fairness | 1.00 | 40 |
| Trust & Safety | 1.40 | 50 |

**Display priorities:**
- Problem Solved and Trust & Safety are the two most important signals
- Speed Response matters most for emergency-context reviews
- Review count builds credibility — locksmiths with 20+ reviews are significantly more trusted
- Recent reviews matter more than old ones (locksmith service quality can change)

**History:** Card rotation after 24h edit window. Old cards preserved. Multiple visits = multiple review snapshots over time.

**Trust communication:**
- High trust + high problem-solved scores = strong hire signal
- Emergency reviews should be visually distinguished (future)
- Author snapshots ensure reviewer identity always visible

## 7. Dashboard Goal

Help the locksmith manage their service operations: update service areas, manage coverage and ETA, track review quality, maintain their portfolio, and handle bookings. Service area management is the most frequently used dashboard surface — locksmiths adjust coverage based on demand and availability.

## 8. Dashboard Sections

### Locksmith Manager
- **Purpose:** Manage service areas and locksmith-specific settings
- **Key actions:** Add/edit/delete service areas, set coverage radius, set ETA ranges, toggle emergency coverage, set travel fees
- **Key metrics:** Number of coverage areas, emergency-covered areas count, service detail count
- **Key editing surfaces:** Service area form (city, state, ZIP, radius, ETA, travel fee, emergency flag)

### Portfolio Manager
- **Purpose:** Showcase completed jobs
- **Key actions:** Add portfolio items with locksmith-specific metadata (job type, property type, lock type, hardware brand, emergency/security flags, service mode, duration)
- **Key metrics:** Portfolio item count
- **Key editing surfaces:** Portfolio create form with locksmith detail fields, photo upload

### Calendar & Slots
- **Purpose:** Manage availability for scheduled and emergency requests
- **Key actions:** Set weekly hours, add exceptions, manage booking slots
- **Key metrics:** Today's bookings, this week's count
- **Key editing surfaces:** Availability rules, exception dates

### Services Editor
- **Purpose:** Manage the locksmith service catalog
- **Key actions:** Toggle services, edit pricing, set emergency/mobile flags per service
- **Key metrics:** Active service count, service family breakdown
- **Key editing surfaces:** Service list with locksmith detail metadata

### Reviews Dashboard
- **Purpose:** Monitor customer feedback quality
- **Key actions:** View reviews with owner filters
- **Key metrics:** Overall average, trust & safety average, problem solved average, review count
- **Key editing surfaces:** None (reviews are customer-owned)

### Profile Settings
- **Purpose:** Update business information
- **Key actions:** Edit hours, location, contact, bio, avatar, banner, licensing info
- **Key metrics:** Profile completeness
- **Key editing surfaces:** About fields, hours schedule, payment methods

## 9. Type-Specific Data Model Needs

Beyond the shared vport model, locksmith needs:

- **Service areas:** `vc.vport_locksmith_service_areas` — area type, city, state, ZIP, radius, ETA range, travel fee, emergency coverage flag
- **Service details:** `vc.vport_locksmith_service_details` — per-service metadata: service family, service kind, mobile/emergency/after-hours flags, pricing model, price range, ETA, warranty, requirements (proof of ownership, photo ID, vehicle info, property address)
- **Portfolio details:** `vc.vport_locksmith_portfolio_details` — per-portfolio-item metadata: job type, property type, lock type, hardware brand, service mode, emergency/security flags, estimated duration
- **Review dimensions:** `reviews.review_dimensions` with locksmith-specific keys: speed_response, problem_solved, professionalism, price_fairness, trust_safety

All four are already deployed in the database.

## 10. Shared vs Dedicated Logic

### Shared with all Vports
- Actor identity system (actorId, kind, displayName, username, avatar)
- Profile header (banner, avatar, name, bio, subscriber count)
- Privacy gating (private profile → PrivateProfileNotice)
- Block detection (blocked → redirect to feed)
- Reviews engine (submit, edit, delete, stats, dimensions)
- Portfolio engine (items, media, tags)
- Booking infrastructure (resources, availability, bookings)
- Photos tab (post-derived media grid)
- Vibes tab (social feed)
- Subscribers tab
- About tab structure (shared base with locksmith extensions)
- Owner tab
- Dashboard shell and card system

### Dedicated to Locksmith
- Locksmith Manager dashboard card (service area CRUD, coverage management)
- Locksmith service area section in About tab (cities, ETA, travel fees, emergency coverage)
- Locksmith service detail enrichment in Services tab (family, emergency, mobile, pricing, ETA, warranty)
- Locksmith portfolio detail metadata in portfolio cards and detail modal (job type, property type, lock type, hardware brand, emergency/security flags)
- Locksmith-specific review dimensions (speed_response, problem_solved, professionalism, price_fairness, trust_safety)
- Locksmith-specific dashboard preset with Locksmith Manager as first card

## 11. UX Priorities

1. **Service area coverage as primary trust signal** — "Do you come to my area?" must be answerable from the About tab immediately
2. **Emergency availability prominence** — emergency flags should be visually distinct throughout (services, areas, portfolio)
3. **Trust through reviews** — Problem Solved and Trust & Safety dimensions provide specific quality signals beyond a generic star rating
4. **Portfolio as proof of work** — showing completed jobs (especially before/after) builds credibility for a trade service
5. **Fast contact path** — phone number and message button must be easily reachable
6. **Mobile-first layout** — most locksmith customers search on phone during a lockout
7. **Price transparency** — pricing model, starting price, and quote requirements visible per service

## 12. Implementation Notes — Dashboard (2026-04-19)

### Locksmith Dashboard Screen
**File:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLocksmithScreen.jsx`

Covers: service area CRUD (add, edit, delete), service detail display, quick stats summary.

**Service Area Form — State field:**
The State Code field is a `<select>` dropdown of all 50 US states + DC + PR, not a free-text input. All form inputs share a consistent `fieldCls` variable (`rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white`). The select additionally sets `appearance-none` to strip browser chrome.

**Error handling pattern:**
`useLocksmithOwner.wrap()` re-throws after setting error state. The screen handlers (`handleAddArea`, `handleUpdateArea`, `handleDeleteArea`) catch the re-throw to suppress unhandled promise rejections. Errors are displayed via the `owner.error` block at the bottom of the form which extracts `.message || .details || .hint || JSON.stringify(error)` to surface Supabase error detail.

**RLS requirement — all three locksmith tables:**

`vport.locksmith_service_areas`:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON vport.locksmith_service_areas TO authenticated;
ALTER TABLE vport.locksmith_service_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON vport.locksmith_service_areas
  FOR ALL TO authenticated
  USING (actor_id IN (
    SELECT a.id FROM vc.actors a
    JOIN vc.actor_owners ao ON ao.actor_id = a.id
    WHERE ao.user_id = (SELECT auth.uid()) AND ao.is_void = false
  ))
  WITH CHECK (actor_id IN (
    SELECT a.id FROM vc.actors a
    JOIN vc.actor_owners ao ON ao.actor_id = a.id
    WHERE ao.user_id = (SELECT auth.uid()) AND ao.is_void = false
  ));
```

`vport.locksmith_service_details`:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON vport.locksmith_service_details TO authenticated;
ALTER TABLE vport.locksmith_service_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON vport.locksmith_service_details
  FOR ALL TO authenticated
  USING (actor_id IN (
    SELECT a.id FROM vc.actors a
    JOIN vc.actor_owners ao ON ao.actor_id = a.id
    WHERE ao.user_id = (SELECT auth.uid()) AND ao.is_void = false
  ))
  WITH CHECK (actor_id IN (
    SELECT a.id FROM vc.actors a
    JOIN vc.actor_owners ao ON ao.actor_id = a.id
    WHERE ao.user_id = (SELECT auth.uid()) AND ao.is_void = false
  ));
```

`vport.locksmith_portfolio_details` (no `actor_id` column — scoped via portfolio join):
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON vport.locksmith_portfolio_details TO authenticated;
ALTER TABLE vport.locksmith_portfolio_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON vport.locksmith_portfolio_details
  FOR ALL TO authenticated
  USING (portfolio_item_id IN (
    SELECT pi.id FROM vport.portfolio_items pi
    JOIN vport.profiles p ON p.id = pi.profile_id
    JOIN vc.actor_owners ao ON ao.actor_id = p.actor_id
    WHERE ao.user_id = (SELECT auth.uid()) AND ao.is_void = false
  ))
  WITH CHECK (portfolio_item_id IN (
    SELECT pi.id FROM vport.portfolio_items pi
    JOIN vport.profiles p ON p.id = pi.profile_id
    JOIN vc.actor_owners ao ON ao.actor_id = p.actor_id
    WHERE ao.user_id = (SELECT auth.uid()) AND ao.is_void = false
  ));
```

---

## 13. Implementation Notes — DAL Schema Fix + About Tab Debug (2026-04-19)

### DAL Schema Correction

All five locksmith DAL files were originally written against `supabase.schema('vc').from('vport_locksmith_*')`. This was wrong — the actual tables live in the `vport` schema, not `vc`. All five files were corrected to use `vportSchema.from('locksmith_*')` via the dedicated `vportClient`.

**Files corrected:**

| File | Before | After |
|---|---|---|
| `locksmithServiceAreas.read.dal.js` | `supabase.schema('vc').from('vport_locksmith_service_areas')` | `vportSchema.from('locksmith_service_areas')` |
| `locksmithServiceAreas.write.dal.js` | `supabase.schema('vc').from('vport_locksmith_service_areas')` | `vportSchema.from('locksmith_service_areas')` |
| `locksmithServiceDetails.read.dal.js` | `supabase.schema('vc').from('vport_locksmith_service_details')` | `vportSchema.from('locksmith_service_details')` |
| `locksmithServiceDetails.write.dal.js` | `supabase.schema('vc').from('vport_locksmith_service_details')` | `vportSchema.from('locksmith_service_details')` |
| `locksmithPortfolioDetails.write.dal.js` | `supabase.schema('vc').from('vport_locksmith_portfolio_details')` | `vportSchema.from('locksmith_portfolio_details')` |

The error symptom was `ERROR: 42P01: relation "vc.vport_locksmith_service_areas" does not exist` on writes, and 404 on REST calls with `content-profile: vc` header. After fix, the correct `content-profile: vport` header is sent.

---

### About Tab Service Areas Not Rendering — Root Cause

**Symptom:** The About tab rendered but the Service Areas section was always empty for locksmith vports, even with service areas saved in the DB.

**Root cause:** `VportAboutView` resolved `type` only from `profile`:
```js
const type = profile?.vportType || profile?.type || profile?.vport_type || null;
```

`profile.vportType` comes from `readActorProfileDAL` → `read_actor_profile` RPC. That RPC does **not** return `vport_type` — the controller has a comment acknowledging this: `// (optional) if you later include vport_type in rpc`. So `type` was always `null`, making `isLocksmith = false`, causing `useLocksmithProfile` to skip the fetch and return empty arrays.

`publicDetails.vportType` IS correctly resolved — via `readVportTypeDAL` which reads from `vport.profile_categories` where `is_primary = true`. `publicDetails` is passed to `VportAboutView` as the `details` prop.

**Fix — `VportAboutView.jsx` line 207:**
```js
// Before:
const type = profile?.vportType || profile?.type || profile?.vport_type || null;

// After:
const type = profile?.vportType || profile?.type || profile?.vport_type || details?.vportType || null;
```

**Prerequisite:** The locksmith VPORT must have a row in `vport.profile_categories` with `category_key = 'locksmith'` and `is_primary = true`. `readVportTypeDAL` reads from this table. If the row is missing, `details.vportType` will also be null.

---

### locksmith_portfolio_details 403 on Write

After the schema fix resolved the 404, writes to `locksmith_portfolio_details` returned 403. This is the expected Supabase behavior when RLS is enabled but no policy exists — all writes are blocked by default. The portfolio item itself uploads successfully to `vport.portfolio_items` (which already has RLS), but the locksmith detail extension row on `locksmith_portfolio_details` has no policy yet.

Fix: run the RLS SQL in Section 12 for all three tables.

---

## 14. Feed-Share System (2026-05-10)

Locksmith VPORT owners can optionally share significant profile updates to the central public feed as system posts. All three post types are implemented and gated behind opt-in checkboxes visible only to the owner.

### Post types

| `post_type` | Trigger surface | Checkbox location | Media |
|---|---|---|---|
| `locksmith_service_area_update` | Add Area / Update Area in Locksmith Manager | `AreaForm` — below Emergency checkbox, above Cancel/Save | None |
| `locksmith_hours_update` | Save Working Hours in Calendar Settings | `VportDashboardCalendarScreen` — above the availability grid | None |
| `locksmith_portfolio_update` | Publish portfolio item in Portfolio Manager | `PortfolioItemForm` — create mode only, below Locksmith Details | First uploaded photo (optional) |

### Architecture contract

- All three controllers call `resolvePublicRealmIdDAL()` — never `identity.realmId` or viewer session realm.
- Void realm is never used for system posts. The public realm is determined by the synchronous constant in `shared/utils/resolveRealm.js`.
- Publish is always non-blocking. The primary save (area write, hours write, portfolio create) must succeed regardless of feed publish outcome. Pattern: `try { await publishController(...); } catch (_) {}` after the primary action.
- Checkboxes default to unchecked on every mount and reset to unchecked after a successful publish attempt.
- 1-hour dedup per `actorId + post_type`. If a post of the same type was already published within the last hour, the controller returns `{ published: false, reason: "throttled" }` silently.

### File locations

| Layer | File |
|---|---|
| DAL | `features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal.js` |
| Controller (areas) | `features/profiles/kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller.js` |
| Controller (hours) | `features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js` |
| Controller (portfolio) | `features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js` |
| Hook | `features/profiles/kinds/vport/hooks/locksmith/usePublishLocksmithPost.js` |
| Area UI | `features/dashboard/vport/screens/components/locksmithScreenComponents.jsx` (`AreaForm`) |
| Area screen | `features/dashboard/vport/screens/VportDashboardLocksmithScreen.jsx` |
| Hours screen | `features/dashboard/vport/screens/VportDashboardCalendarScreen.jsx` |
| Portfolio form | `features/dashboard/vport/screens/components/portfolio/PortfolioItemForm.jsx` |
| Portfolio hook | `features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioItemSubmit.js` |

### Feed renderer

No custom renderer is registered for locksmith post types in `PostCard.view.jsx`. All three fall through to the default text/media renderer. This is intentional — the posts read naturally as text with an optional photo.

### Deferred

`locksmith_service_update` (per-service detail changes) is deferred because no UI save point exists — `ServiceDetailRow` and `GapServiceRow` in the Locksmith Manager dashboard are read-only display components. No `ctrlSaveServiceDetail` call is made from any UI component.

---

## 15. Future Expansion

- **Real-time availability status:** Show "Available now" / "Next available in X hours" based on calendar
- **Emergency request priority queue:** Fast-track emergency requests with higher urgency routing
- **Service area map visualization:** Interactive map showing coverage zones with ETA overlays
- **License/certification verification:** Verified license badge on profile
- **Fleet tracking:** Multi-technician dispatch with real-time location
- **Insurance documentation:** Upload and display insurance certificates for commercial clients
- **Vehicle/property history:** Return customer recognition based on prior jobs
- **Smart lock expertise badges:** Certifications for specific smart lock brands (Yale, Schlage, August)
- **Price estimator widget:** Quick quote calculator based on service type and location
- **Customer photo submission:** Customers can send photos of their lock/situation before the technician arrives

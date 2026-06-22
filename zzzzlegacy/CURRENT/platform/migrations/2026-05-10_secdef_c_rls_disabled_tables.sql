-- PROPOSAL ONLY — review before applying
-- ============================================================
-- FILE: 2026-05-10_secdef_c_rls_disabled_tables.sql
-- PURPOSE: Enable RLS on tables where it is entirely disabled,
--          then add appropriate policies.
--          Without RLS, any authenticated (or anon) PostgREST
--          request can read or write every row with no restriction.
-- RISK LEVEL: MEDIUM — enabling RLS on existing tables can break
--             app features if callers don't match the new policies.
--             Test every affected surface in staging first.
-- DEPLOY ORDER: 3 of 3 (run after _a and _b)
-- IDEMPOTENT: Yes — ALTER TABLE ENABLE ROW LEVEL SECURITY is
--             idempotent. DROP IF EXISTS used before all policies.
-- PRE-CHECK QUERY (run first to confirm RLS-disabled tables):
--   SELECT schemaname, tablename, rowsecurity
--   FROM pg_tables
--   WHERE rowsecurity = false
--     AND schemaname NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage', 'realtime', 'extensions', 'vault')
--   ORDER BY schemaname, tablename;
-- ROLLBACK: ALTER TABLE <schema>.<table> DISABLE ROW LEVEL SECURITY;
--           DROP POLICY IF EXISTS <policy_name> ON <schema>.<table>;
-- ============================================================
-- Tables covered (grouped by schema):
--
-- SCHEMA: platform (1 table)
--   platform.user_capabilities — self-read via join to user_app_accounts
--
-- SCHEMA: traffic (14 tables)
--   traffic.business_claim_requests — anon INSERT; service-only read
--   traffic.business_intake_leads   — anon INSERT; service-only read
--   traffic.cities                  — public read (SEO reference data)
--   traffic.neighborhoods           — public read (SEO reference data)
--   traffic.page_candidates         — public read (SEO candidate pages)
--   traffic.page_internal_links     — public read (SEO internal link graph)
--   traffic.price_aggregates        — public read (public pricing data)
--   traffic.provider_services       — public read (provider service listings)
--   traffic.provider_stats_current  — public read (provider review stats)
--   traffic.providers               — public read (provider directory)
--   traffic.seo_rules               — service-only (internal SEO config)
--   traffic.services                — public read (service taxonomy)
--   traffic.sitemap_chunks          — public read (sitemap generation data)
--   traffic.specialties             — public read (specialty taxonomy)
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- SCHEMA: platform
-- ─────────────────────────────────────────────────────────────

-- platform.user_capabilities
-- Context: Maps user_app_account_id to feature capability flags.
--   Key column: user_app_account_id uuid (no direct user_id).
--   Self-read requires join to platform.user_app_accounts to resolve user_id.
--   Users should be able to read their own capability flags.
--   No direct user mutations — capabilities are set by admin/service.
-- RLS was disabled — enabling and adding self-read policy.
-- Rollback:
--   ALTER TABLE platform.user_capabilities DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "user_capabilities_self_read" ON platform.user_capabilities;
--   DROP POLICY IF EXISTS "user_capabilities_deny_write" ON platform.user_capabilities;

ALTER TABLE platform.user_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_capabilities_self_read" ON platform.user_capabilities;
CREATE POLICY "user_capabilities_self_read"
  ON platform.user_capabilities
  FOR SELECT
  TO authenticated
  USING (
    user_app_account_id IN (
      SELECT id
      FROM platform.user_app_accounts
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_capabilities_deny_write" ON platform.user_capabilities;
CREATE POLICY "user_capabilities_deny_write"
  ON platform.user_capabilities
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE platform.user_capabilities IS
  'Feature capability flags per user_app_account. '
  'Users can read their own capabilities. Mutations via service_role only.';


-- ─────────────────────────────────────────────────────────────
-- SCHEMA: traffic
-- Context: TRAZE programmatic SEO discovery engine.
--   Traffic is a read-only public directory — no auth, no user mutations.
--   All data is platform-managed content (no user-generated rows).
--   Anon users (unauthenticated web crawlers, visitors) must be able to read.
--   Two special tables accept anon INSERT for lead capture:
--     business_claim_requests and business_intake_leads.
-- ─────────────────────────────────────────────────────────────

-- traffic.cities
-- Context: City reference data for SEO directory pages.
--   Public read — anon and authenticated, no mutations from callers.
-- Rollback:
--   ALTER TABLE traffic.cities DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "cities_public_read" ON traffic.cities;
--   DROP POLICY IF EXISTS "cities_deny_write" ON traffic.cities;

ALTER TABLE traffic.cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cities_public_read" ON traffic.cities;
CREATE POLICY "cities_public_read"
  ON traffic.cities
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "cities_deny_write" ON traffic.cities;
CREATE POLICY "cities_deny_write"
  ON traffic.cities
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.neighborhoods
-- Context: Neighborhood reference data for SEO directory pages.
--   Public read — anon and authenticated, no mutations from callers.
-- Rollback:
--   ALTER TABLE traffic.neighborhoods DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "neighborhoods_public_read" ON traffic.neighborhoods;
--   DROP POLICY IF EXISTS "neighborhoods_deny_write" ON traffic.neighborhoods;

ALTER TABLE traffic.neighborhoods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "neighborhoods_public_read" ON traffic.neighborhoods;
CREATE POLICY "neighborhoods_public_read"
  ON traffic.neighborhoods
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "neighborhoods_deny_write" ON traffic.neighborhoods;
CREATE POLICY "neighborhoods_deny_write"
  ON traffic.neighborhoods
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.page_candidates
-- Context: Candidate SEO pages pending review/generation.
--   Public read — TRAZE reads this to determine which pages to generate.
--   No mutations from callers; managed by service_role.
-- Rollback:
--   ALTER TABLE traffic.page_candidates DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "page_candidates_public_read" ON traffic.page_candidates;
--   DROP POLICY IF EXISTS "page_candidates_deny_write" ON traffic.page_candidates;

ALTER TABLE traffic.page_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_candidates_public_read" ON traffic.page_candidates;
CREATE POLICY "page_candidates_public_read"
  ON traffic.page_candidates
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "page_candidates_deny_write" ON traffic.page_candidates;
CREATE POLICY "page_candidates_deny_write"
  ON traffic.page_candidates
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.page_internal_links
-- Context: Internal link graph between SEO directory pages.
--   Public read — used by sitemap and internal linking logic.
-- Rollback:
--   ALTER TABLE traffic.page_internal_links DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "page_internal_links_public_read" ON traffic.page_internal_links;
--   DROP POLICY IF EXISTS "page_internal_links_deny_write" ON traffic.page_internal_links;

ALTER TABLE traffic.page_internal_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_internal_links_public_read" ON traffic.page_internal_links;
CREATE POLICY "page_internal_links_public_read"
  ON traffic.page_internal_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "page_internal_links_deny_write" ON traffic.page_internal_links;
CREATE POLICY "page_internal_links_deny_write"
  ON traffic.page_internal_links
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.price_aggregates
-- Context: Aggregated pricing data for service providers in the directory.
--   Public read — displayed on TRAZE directory pages.
-- Rollback:
--   ALTER TABLE traffic.price_aggregates DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "price_aggregates_public_read" ON traffic.price_aggregates;
--   DROP POLICY IF EXISTS "price_aggregates_deny_write" ON traffic.price_aggregates;

ALTER TABLE traffic.price_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_aggregates_public_read" ON traffic.price_aggregates;
CREATE POLICY "price_aggregates_public_read"
  ON traffic.price_aggregates
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "price_aggregates_deny_write" ON traffic.price_aggregates;
CREATE POLICY "price_aggregates_deny_write"
  ON traffic.price_aggregates
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.provider_services
-- Context: Links providers to services in the directory.
--   Public read — used to display service listings on provider pages.
-- Rollback:
--   ALTER TABLE traffic.provider_services DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "provider_services_public_read" ON traffic.provider_services;
--   DROP POLICY IF EXISTS "provider_services_deny_write" ON traffic.provider_services;

ALTER TABLE traffic.provider_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_services_public_read" ON traffic.provider_services;
CREATE POLICY "provider_services_public_read"
  ON traffic.provider_services
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "provider_services_deny_write" ON traffic.provider_services;
CREATE POLICY "provider_services_deny_write"
  ON traffic.provider_services
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.provider_stats_current
-- Context: Current aggregate stats for providers (review count, avg rating, etc.).
--   Public read — displayed on provider directory pages.
-- Rollback:
--   ALTER TABLE traffic.provider_stats_current DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "provider_stats_current_public_read" ON traffic.provider_stats_current;
--   DROP POLICY IF EXISTS "provider_stats_current_deny_write" ON traffic.provider_stats_current;

ALTER TABLE traffic.provider_stats_current ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_stats_current_public_read" ON traffic.provider_stats_current;
CREATE POLICY "provider_stats_current_public_read"
  ON traffic.provider_stats_current
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "provider_stats_current_deny_write" ON traffic.provider_stats_current;
CREATE POLICY "provider_stats_current_deny_write"
  ON traffic.provider_stats_current
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.providers
-- Context: Service provider directory entries.
--   Public read — primary content of TRAZE directory pages.
--   Only active (non-deleted) providers visible to public.
-- Rollback:
--   ALTER TABLE traffic.providers DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "providers_public_read" ON traffic.providers;
--   DROP POLICY IF EXISTS "providers_deny_write" ON traffic.providers;

ALTER TABLE traffic.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_public_read" ON traffic.providers;
CREATE POLICY "providers_public_read"
  ON traffic.providers
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND coalesce(is_indexable, true) = true
  );

DROP POLICY IF EXISTS "providers_deny_write" ON traffic.providers;
CREATE POLICY "providers_deny_write"
  ON traffic.providers
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.seo_rules
-- Context: Internal SEO configuration rules. No public access needed.
--   Service-role only — used by the TRAZE pipeline, not by callers.
-- Rollback:
--   ALTER TABLE traffic.seo_rules DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "seo_rules_deny_all" ON traffic.seo_rules;

ALTER TABLE traffic.seo_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seo_rules_deny_all" ON traffic.seo_rules;
CREATE POLICY "seo_rules_deny_all"
  ON traffic.seo_rules
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE traffic.seo_rules IS
  'Internal SEO configuration rules for TRAZE pipeline. Service-role only access.';


-- traffic.services
-- Context: Service taxonomy for the TRAZE directory (e.g., "Locksmith", "Barbershop").
--   Public read — reference data for directory pages and search.
-- Rollback:
--   ALTER TABLE traffic.services DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "services_public_read" ON traffic.services;
--   DROP POLICY IF EXISTS "services_deny_write" ON traffic.services;

ALTER TABLE traffic.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_public_read" ON traffic.services;
CREATE POLICY "services_public_read"
  ON traffic.services
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "services_deny_write" ON traffic.services;
CREATE POLICY "services_deny_write"
  ON traffic.services
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.sitemap_chunks
-- Context: Sitemap chunk data for XML sitemap generation.
--   Public read — used by TRAZE sitemap endpoint.
-- Rollback:
--   ALTER TABLE traffic.sitemap_chunks DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "sitemap_chunks_public_read" ON traffic.sitemap_chunks;
--   DROP POLICY IF EXISTS "sitemap_chunks_deny_write" ON traffic.sitemap_chunks;

ALTER TABLE traffic.sitemap_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sitemap_chunks_public_read" ON traffic.sitemap_chunks;
CREATE POLICY "sitemap_chunks_public_read"
  ON traffic.sitemap_chunks
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "sitemap_chunks_deny_write" ON traffic.sitemap_chunks;
CREATE POLICY "sitemap_chunks_deny_write"
  ON traffic.sitemap_chunks
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.specialties
-- Context: Specialty taxonomy for the TRAZE directory (sub-categories of services).
--   Public read — reference data for directory pages.
-- Rollback:
--   ALTER TABLE traffic.specialties DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "specialties_public_read" ON traffic.specialties;
--   DROP POLICY IF EXISTS "specialties_deny_write" ON traffic.specialties;

ALTER TABLE traffic.specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "specialties_public_read" ON traffic.specialties;
CREATE POLICY "specialties_public_read"
  ON traffic.specialties
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "specialties_deny_write" ON traffic.specialties;
CREATE POLICY "specialties_deny_write"
  ON traffic.specialties
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- traffic.business_claim_requests
-- Context: Lead capture table for businesses claiming their TRAZE directory listing.
--   Anon INSERT allowed (unauthenticated visitors submit claim requests).
--   Read restricted to service_role only (contains contact info/PII).
-- Rollback:
--   ALTER TABLE traffic.business_claim_requests DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "business_claim_requests_anon_insert" ON traffic.business_claim_requests;
--   DROP POLICY IF EXISTS "business_claim_requests_deny_read" ON traffic.business_claim_requests;

ALTER TABLE traffic.business_claim_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_claim_requests_anon_insert" ON traffic.business_claim_requests;
CREATE POLICY "business_claim_requests_anon_insert"
  ON traffic.business_claim_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Deny all reads via PostgREST; service_role handles reads internally
DROP POLICY IF EXISTS "business_claim_requests_deny_read" ON traffic.business_claim_requests;
CREATE POLICY "business_claim_requests_deny_read"
  ON traffic.business_claim_requests
  FOR SELECT
  TO anon, authenticated
  USING (false);

COMMENT ON TABLE traffic.business_claim_requests IS
  'Business listing claim requests. Anon INSERT allowed for lead capture. '
  'Read restricted to service_role (contains contact PII).';


-- traffic.business_intake_leads
-- Context: Lead capture table for businesses requesting to join the VCSM platform.
--   Anon INSERT allowed (unauthenticated visitors submit interest forms).
--   Read restricted to service_role only (contains contact info/PII).
-- Rollback:
--   ALTER TABLE traffic.business_intake_leads DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "business_intake_leads_anon_insert" ON traffic.business_intake_leads;
--   DROP POLICY IF EXISTS "business_intake_leads_deny_read" ON traffic.business_intake_leads;

ALTER TABLE traffic.business_intake_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_intake_leads_anon_insert" ON traffic.business_intake_leads;
CREATE POLICY "business_intake_leads_anon_insert"
  ON traffic.business_intake_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "business_intake_leads_deny_read" ON traffic.business_intake_leads;
CREATE POLICY "business_intake_leads_deny_read"
  ON traffic.business_intake_leads
  FOR SELECT
  TO anon, authenticated
  USING (false);

COMMENT ON TABLE traffic.business_intake_leads IS
  'Platform intake lead capture. Anon INSERT allowed for lead capture. '
  'Read restricted to service_role (contains contact PII).';

-- ============================================================
-- END OF FILE: 2026-05-10_secdef_c_rls_disabled_tables.sql
-- ============================================================

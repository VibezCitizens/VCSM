-- PROPOSAL ONLY — review before applying
-- ============================================================
-- FILE: 2026-05-10_secdef_b_zero_policy_tables.sql
-- PURPOSE: Add RLS policies to tables that have RLS ENABLED
--          but ZERO policies — effectively locking out all access.
--          These tables are currently inaccessible via PostgREST.
-- RISK LEVEL: MEDIUM — policies grant new access where none exists.
--             Test each table in staging before applying to prod.
-- DEPLOY ORDER: 2 of 3 (run after _a, before _c)
-- IDEMPOTENT: Yes — all statements use IF NOT EXISTS or DROP IF EXISTS
--             before CREATE POLICY.
-- PRE-CHECK QUERY (run first to confirm zero-policy tables):
--   SELECT schemaname, tablename, COUNT(policyname) AS policy_count
--   FROM pg_policies
--   GROUP BY schemaname, tablename
--   HAVING COUNT(policyname) = 0
--   ORDER BY schemaname, tablename;
-- ROLLBACK: DROP POLICY IF EXISTS <policy_name> ON <schema>.<table>;
-- ============================================================
-- Tables covered (grouped by schema):
--
-- SCHEMA: chat (2 tables)
--   chat.legacy_mappings    — service-only (no user columns; mapping data)
--   chat.outbox_events      — service-only (event queue; no user columns)
--
-- SCHEMA: learning (3 tables)
--   learning.assignment_rubrics      — admin-or-member read; no direct write
--   learning.audit_log               — admin-only read; service-only write
--   learning.student_login_id_counters — service-only (internal counter)
--
-- SCHEMA: notification (1 table)
--   notification.event_categories    — public read (reference data)
--
-- SCHEMA: platform (8 tables)
--   platform.app_roles               — service-only internal config
--   platform.capabilities            — service-only internal config
--   platform.legal_documents         — public anon read (users must see consent docs)
--   platform.media_assets            — owner-read via service (no direct user_id)
--   platform.media_jobs              — service-only (no direct user_id column)
--   platform.platform_owners         — service-only (intentional lockout)
--   platform.role_capabilities       — service-only internal config
--   platform.user_app_account_roles  — self-read via join to user_app_accounts
--
-- SCHEMA: vc (3 tables)
--   vc.professional_housing_categories      — public read (reference data)
--   vc.professional_housing_note_categories — public read (reference data)
--   vc.void_profiles                        — service-only (intentional)
-- SCHEMA: vport (4 tables, were incorrectly listed as vc.vport_* in prior draft)
--   vport.fuel_type_localizations           — public read (reference data)
--   vport.fuel_types                        — public read (reference data)
--   vport.station_brands                    — public read (reference data)
--   vport.station_contact_routes            — authenticated read
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- SCHEMA: chat
-- ─────────────────────────────────────────────────────────────

-- chat.legacy_mappings
-- Context: Migration mapping table (source_system, source_table, source_id,
--   target_table, target_id). No user_id or actor_id column.
--   Accessible only by service_role for migration tooling.
-- Policy type: service-only (explicit deny for authenticated + anon)
-- Rollback: DROP POLICY IF EXISTS "legacy_mappings_deny_all" ON chat.legacy_mappings;

DROP POLICY IF EXISTS "legacy_mappings_deny_all" ON chat.legacy_mappings;
CREATE POLICY "legacy_mappings_deny_all"
  ON chat.legacy_mappings
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE chat.legacy_mappings IS
  'Migration mapping table. Access restricted to service_role only. '
  'RLS denies all authenticated/anon access — use service_role connection for migration tooling.';


-- chat.outbox_events
-- Context: Outbound event queue for async processing. No user_id column.
--   Service role polls this table; no direct user access needed.
-- Policy type: service-only (explicit deny for authenticated + anon)
-- Rollback: DROP POLICY IF EXISTS "outbox_events_deny_all" ON chat.outbox_events;

DROP POLICY IF EXISTS "outbox_events_deny_all" ON chat.outbox_events;
CREATE POLICY "outbox_events_deny_all"
  ON chat.outbox_events
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE chat.outbox_events IS
  'Async outbox event queue. Access restricted to service_role only. '
  'No authenticated/anon access needed or appropriate.';


-- ─────────────────────────────────────────────────────────────
-- SCHEMA: learning
-- ─────────────────────────────────────────────────────────────

-- learning.assignment_rubrics
-- Context: Rubric definitions for course assignments. Scoped to assignment_id.
--   No direct user column — access is course-member scoped via assignment membership.
--   Teachers/course admins need to read/write; students need to read.
-- Policy type: admin write; course-member read
-- Rollback: DROP POLICY IF EXISTS "assignment_rubrics_admin_all" ON learning.assignment_rubrics;
--           DROP POLICY IF EXISTS "assignment_rubrics_member_read" ON learning.assignment_rubrics;

DROP POLICY IF EXISTS "assignment_rubrics_admin_all" ON learning.assignment_rubrics;
CREATE POLICY "assignment_rubrics_admin_all"
  ON learning.assignment_rubrics
  FOR ALL
  TO authenticated
  USING (
    learning.is_current_user_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM learning.assignments a
      JOIN learning.course_memberships cm ON cm.course_id = a.course_id
      WHERE a.id = learning.assignment_rubrics.assignment_id
        AND cm.actor_id = learning.current_actor_id()
        AND cm.role IN ('admin', 'instructor', 'teacher')
        AND cm.status = 'active'
    )
  )
  WITH CHECK (
    learning.is_current_user_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM learning.assignments a
      JOIN learning.course_memberships cm ON cm.course_id = a.course_id
      WHERE a.id = learning.assignment_rubrics.assignment_id
        AND cm.actor_id = learning.current_actor_id()
        AND cm.role IN ('admin', 'instructor', 'teacher')
        AND cm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "assignment_rubrics_member_read" ON learning.assignment_rubrics;
CREATE POLICY "assignment_rubrics_member_read"
  ON learning.assignment_rubrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM learning.assignments a
      JOIN learning.course_memberships cm ON cm.course_id = a.course_id
      WHERE a.id = learning.assignment_rubrics.assignment_id
        AND cm.actor_id = learning.current_actor_id()
        AND cm.status = 'active'
    )
  );


-- learning.audit_log
-- Context: Audit trail for learning schema operations.
--   Has actor_id uuid column.
--   Intentional: only platform admins should read; writes come from SECURITY DEFINER functions.
-- Policy type: admin-read; service-only write
-- Rollback: DROP POLICY IF EXISTS "audit_log_admin_read" ON learning.audit_log;
--           DROP POLICY IF EXISTS "audit_log_deny_write" ON learning.audit_log;

DROP POLICY IF EXISTS "audit_log_admin_read" ON learning.audit_log;
CREATE POLICY "audit_log_admin_read"
  ON learning.audit_log
  FOR SELECT
  TO authenticated
  USING (learning.is_current_user_platform_admin());

DROP POLICY IF EXISTS "audit_log_deny_write" ON learning.audit_log;
CREATE POLICY "audit_log_deny_write"
  ON learning.audit_log
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Note: INSERT to learning.audit_log must only occur through SECURITY DEFINER
-- functions (e.g., learning.create_tenant_bootstrap). The deny_write policy
-- blocks direct PostgREST INSERT/UPDATE/DELETE while allowing service_role writes.


-- learning.student_login_id_counters
-- Context: Internal counter table (year + last_value). No user column.
--   Written only by learning.generate_student_login_id() SECURITY DEFINER function.
--   No authenticated user access needed.
-- Policy type: service-only (deny all authenticated)
-- Rollback: DROP POLICY IF EXISTS "student_login_id_counters_deny_all" ON learning.student_login_id_counters;

DROP POLICY IF EXISTS "student_login_id_counters_deny_all" ON learning.student_login_id_counters;
CREATE POLICY "student_login_id_counters_deny_all"
  ON learning.student_login_id_counters
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE learning.student_login_id_counters IS
  'Internal sequential counter for student login ID generation. '
  'Mutations are performed only by learning.generate_student_login_id() (SECURITY DEFINER). '
  'Direct authenticated/anon access is intentionally blocked.';


-- ─────────────────────────────────────────────────────────────
-- SCHEMA: notification
-- ─────────────────────────────────────────────────────────────

-- notification.event_categories
-- Context: Reference/config table mapping event category keys to labels.
--   Public-safe read — no user data. All authenticated users need to read this
--   to understand notification preference categories.
-- Policy type: public read (reference data)
-- Rollback: DROP POLICY IF EXISTS "event_categories_public_read" ON notification.event_categories;

DROP POLICY IF EXISTS "event_categories_public_read" ON notification.event_categories;
CREATE POLICY "event_categories_public_read"
  ON notification.event_categories
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE notification.event_categories IS
  'Reference table for notification event categories. Public read for authenticated users.';


-- ─────────────────────────────────────────────────────────────
-- SCHEMA: platform
-- ─────────────────────────────────────────────────────────────

-- platform.app_roles
-- Context: Internal role definitions for apps. No user column.
--   Config data — authenticated users might need to read their app role definitions.
-- Policy type: authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "app_roles_authenticated_read" ON platform.app_roles;
--           DROP POLICY IF EXISTS "app_roles_deny_write" ON platform.app_roles;

DROP POLICY IF EXISTS "app_roles_authenticated_read" ON platform.app_roles;
CREATE POLICY "app_roles_authenticated_read"
  ON platform.app_roles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "app_roles_deny_write" ON platform.app_roles;
CREATE POLICY "app_roles_deny_write"
  ON platform.app_roles
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE platform.app_roles IS
  'App role definitions. Read-only for authenticated users. Mutations via service_role only.';


-- platform.capabilities
-- Context: Internal feature capability registry. No user column.
--   Config data — read-only reference table.
-- Policy type: authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "capabilities_authenticated_read" ON platform.capabilities;
--           DROP POLICY IF EXISTS "capabilities_deny_write" ON platform.capabilities;

DROP POLICY IF EXISTS "capabilities_authenticated_read" ON platform.capabilities;
CREATE POLICY "capabilities_authenticated_read"
  ON platform.capabilities
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "capabilities_deny_write" ON platform.capabilities;
CREATE POLICY "capabilities_deny_write"
  ON platform.capabilities
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);


-- platform.legal_documents
-- Context: Legal consent documents (Terms of Service, Privacy Policy, etc.).
--   CRITICAL: Users must be able to read these documents before consenting.
--   Without a SELECT policy, ConsentGateScreen cannot load consent docs.
-- Policy type: anon + authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "legal_documents_public_read" ON platform.legal_documents;
--           DROP POLICY IF EXISTS "legal_documents_deny_write" ON platform.legal_documents;

DROP POLICY IF EXISTS "legal_documents_public_read" ON platform.legal_documents;
CREATE POLICY "legal_documents_public_read"
  ON platform.legal_documents
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "legal_documents_deny_write" ON platform.legal_documents;
CREATE POLICY "legal_documents_deny_write"
  ON platform.legal_documents
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE platform.legal_documents IS
  'Legal consent documents. Active documents are publicly readable (required for consent gate). '
  'Mutations via service_role only.';


-- platform.media_assets
-- !! DO NOT APPLY — EXCLUDED FROM THIS SECDEF BLOCK !!
-- Governance decision: 2026-05-19 (Carnage Plan A / DB audit)
-- Reason: platform.media_assets already has correct owner-scoped RLS from its canonical migration:
--   - "actor owner can insert media asset" (WITH CHECK via vc.actor_owners)
--   - "actor owner can select media asset" (USING via vc.actor_owners)
--   Authenticated users DO need INSERT + SELECT access — they write and read their own media assets.
-- Flaw: This deny-all policy would be INEFFECTIVE as written — PostgreSQL permissive OR logic means
--   the deny-all (false) is OR'd with the existing INSERT/SELECT policies (true for owners),
--   so owner access would NOT be blocked. The policy would be dead code.
-- The comment above ("No direct user access needed") is FACTUALLY INCORRECT for this table.
-- Ref: zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md (Plan A)
--      zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-19_12-00_db_media-assets-rls-audit.md


-- platform.media_jobs
-- Context: Media processing job queue. No direct user_id column (has locked_by text).
--   Service-level only. No authenticated user access needed.
-- Policy type: service-only (deny all authenticated)
-- Rollback: DROP POLICY IF EXISTS "media_jobs_deny_all" ON platform.media_jobs;

DROP POLICY IF EXISTS "media_jobs_deny_all" ON platform.media_jobs;
CREATE POLICY "media_jobs_deny_all"
  ON platform.media_jobs
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE platform.media_jobs IS
  'Media processing job queue. Service-role only access — no direct user access.';


-- platform.platform_owners
-- Context: Platform owner registry. Intentional lockout for authenticated users.
--   Only service_role or SECURITY DEFINER functions should read this table.
--   (Used internally by learning.create_tenant_bootstrap for authorization checks.)
-- Policy type: service-only (deny all authenticated) — intentional
-- Rollback: DROP POLICY IF EXISTS "platform_owners_deny_all" ON platform.platform_owners;

DROP POLICY IF EXISTS "platform_owners_deny_all" ON platform.platform_owners;
CREATE POLICY "platform_owners_deny_all"
  ON platform.platform_owners
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE platform.platform_owners IS
  'Platform owner registry. Intentionally inaccessible to authenticated users. '
  'SECURITY DEFINER functions use this table internally for authorization.';


-- platform.role_capabilities
-- Context: Maps roles to capabilities. Internal join table, no user column.
--   Authenticated users may need to read this for UI capability checks.
-- Policy type: authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "role_capabilities_authenticated_read" ON platform.role_capabilities;
--           DROP POLICY IF EXISTS "role_capabilities_deny_write" ON platform.role_capabilities;

DROP POLICY IF EXISTS "role_capabilities_authenticated_read" ON platform.role_capabilities;
CREATE POLICY "role_capabilities_authenticated_read"
  ON platform.role_capabilities
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "role_capabilities_deny_write" ON platform.role_capabilities;
CREATE POLICY "role_capabilities_deny_write"
  ON platform.role_capabilities
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);


-- platform.user_app_account_roles
-- Context: Maps user_app_account_id to app roles. No direct user_id column.
--   Key column is user_app_account_id — join to platform.user_app_accounts to find user.
--   Users should be able to read their own app roles.
-- Policy type: self-read via join; service-only write
-- Rollback: DROP POLICY IF EXISTS "user_app_account_roles_self_read" ON platform.user_app_account_roles;
--           DROP POLICY IF EXISTS "user_app_account_roles_deny_write" ON platform.user_app_account_roles;

DROP POLICY IF EXISTS "user_app_account_roles_self_read" ON platform.user_app_account_roles;
CREATE POLICY "user_app_account_roles_self_read"
  ON platform.user_app_account_roles
  FOR SELECT
  TO authenticated
  USING (
    user_app_account_id IN (
      SELECT id
      FROM platform.user_app_accounts
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_app_account_roles_deny_write" ON platform.user_app_account_roles;
CREATE POLICY "user_app_account_roles_deny_write"
  ON platform.user_app_account_roles
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE platform.user_app_account_roles IS
  'Maps user_app_account_id to app roles. Users can read their own roles. '
  'Mutations via service_role only.';


-- ─────────────────────────────────────────────────────────────
-- SCHEMA: vc
-- ─────────────────────────────────────────────────────────────

-- vc.professional_housing_categories
-- Context: Reference category data for professional housing feature.
--   No user column — static config. Authenticated users need to read for UI.
-- Policy type: authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "professional_housing_categories_read" ON vc.professional_housing_categories;

DROP POLICY IF EXISTS "professional_housing_categories_read" ON vc.professional_housing_categories;
CREATE POLICY "professional_housing_categories_read"
  ON vc.professional_housing_categories
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "professional_housing_categories_deny_write" ON vc.professional_housing_categories;
CREATE POLICY "professional_housing_categories_deny_write"
  ON vc.professional_housing_categories
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);


-- vc.professional_housing_note_categories
-- Context: Reference note category data for professional housing.
--   No user column — static config.
-- Policy type: authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "professional_housing_note_categories_read" ON vc.professional_housing_note_categories;

DROP POLICY IF EXISTS "professional_housing_note_categories_read" ON vc.professional_housing_note_categories;
CREATE POLICY "professional_housing_note_categories_read"
  ON vc.professional_housing_note_categories
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "professional_housing_note_categories_deny_write" ON vc.professional_housing_note_categories;
CREATE POLICY "professional_housing_note_categories_deny_write"
  ON vc.professional_housing_note_categories
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);


-- vport.fuel_type_localizations
-- Context: Localization strings for fuel types. No user column.
--   Public reference data — anon and authenticated users need to read for UI.
-- Policy type: anon + authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "fuel_type_localizations_public_read" ON vport.fuel_type_localizations;

DROP POLICY IF EXISTS "fuel_type_localizations_public_read" ON vport.fuel_type_localizations;
CREATE POLICY "fuel_type_localizations_public_read"
  ON vport.fuel_type_localizations
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "fuel_type_localizations_deny_write" ON vport.fuel_type_localizations;
CREATE POLICY "fuel_type_localizations_deny_write"
  ON vport.fuel_type_localizations
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);


-- vport.fuel_types
-- Context: Fuel type definitions (regular, diesel, premium, etc.). No user column.
--   Public reference data — anon and authenticated users need to read for UI.
-- Policy type: anon + authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "fuel_types_public_read" ON vport.fuel_types;

DROP POLICY IF EXISTS "fuel_types_public_read" ON vport.fuel_types;
CREATE POLICY "fuel_types_public_read"
  ON vport.fuel_types
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "fuel_types_deny_write" ON vport.fuel_types;
CREATE POLICY "fuel_types_deny_write"
  ON vport.fuel_types
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);


-- vport.station_brands
-- Context: Gas station brand registry (Shell, BP, Chevron, etc.). No user column.
--   Public reference data — anon and authenticated users need to read for UI.
-- Policy type: anon + authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "station_brands_public_read" ON vport.station_brands;

DROP POLICY IF EXISTS "station_brands_public_read" ON vport.station_brands;
CREATE POLICY "station_brands_public_read"
  ON vport.station_brands
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "station_brands_deny_write" ON vport.station_brands;
CREATE POLICY "station_brands_deny_write"
  ON vport.station_brands
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);


-- vport.station_contact_routes
-- Context: Contact routing configurations for vport stations.
--   Readable by authenticated users; no direct write by users.
-- Policy type: authenticated read; service-only write
-- Rollback: DROP POLICY IF EXISTS "station_contact_routes_read" ON vport.station_contact_routes;

DROP POLICY IF EXISTS "station_contact_routes_read" ON vport.station_contact_routes;
CREATE POLICY "station_contact_routes_read"
  ON vport.station_contact_routes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "station_contact_routes_deny_write" ON vport.station_contact_routes;
CREATE POLICY "station_contact_routes_deny_write"
  ON vport.station_contact_routes
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);


-- vc.void_profiles
-- Context: Archive of voided/deleted profile records. Intentional lockout.
--   Service-role only — no authenticated user should access voided profiles.
-- Policy type: service-only (deny all authenticated)
-- Rollback: DROP POLICY IF EXISTS "void_profiles_deny_all" ON vc.void_profiles;

DROP POLICY IF EXISTS "void_profiles_deny_all" ON vc.void_profiles;
CREATE POLICY "void_profiles_deny_all"
  ON vc.void_profiles
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE vc.void_profiles IS
  'Archive of voided/deleted profile records. Intentionally inaccessible to authenticated users. '
  'Service-role only access for data retention and compliance.';

-- ============================================================
-- END OF FILE: 2026-05-10_secdef_b_zero_policy_tables.sql
-- ============================================================

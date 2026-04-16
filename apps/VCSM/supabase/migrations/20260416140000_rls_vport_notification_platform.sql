-- ============================================================
-- Migration: RLS — vport, notification, platform hardening
-- Date: 2026-04-16
-- Scope: vport.*, notification.events, notification.delivery_attempts, platform.*
-- ============================================================
-- Deploy via Supabase SQL editor (Docker unavailable for CLI push).
-- All policies use vport.actor_can_manage_profile / actor_can_view_profile
-- helpers where a profile_id is available. Tables without a direct profile_id
-- join through their parent table using EXISTS subqueries.
-- ============================================================


-- ===========================================================
-- SECTION 1: vport.profiles — fill missing policies
-- ===========================================================

-- Public can read active, non-deleted profiles
CREATE POLICY profiles_select_public ON vport.profiles
  FOR SELECT
  USING (is_active = true AND is_deleted = false);

-- INSERT locked to service_role only (all vport creation goes through RPCs)
CREATE POLICY profiles_insert_service_role ON vport.profiles
  FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');

-- Owner can delete (soft-delete should always be preferred, but allow hard-delete for owner)
CREATE POLICY profiles_delete_owner ON vport.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = profiles.actor_id
        AND ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );


-- ===========================================================
-- SECTION 2: vport.profile_actor_access — add all CRUD policies
-- ===========================================================

CREATE POLICY profile_actor_access_select ON vport.profile_actor_access
  FOR SELECT
  USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));

CREATE POLICY profile_actor_access_insert ON vport.profile_actor_access
  FOR INSERT
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

CREATE POLICY profile_actor_access_update ON vport.profile_actor_access
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

CREATE POLICY profile_actor_access_delete ON vport.profile_actor_access
  FOR DELETE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));


-- ===========================================================
-- SECTION 3: vport.profile_public_details — add all CRUD policies
-- ===========================================================

CREATE POLICY profile_public_details_select ON vport.profile_public_details
  FOR SELECT
  USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));

CREATE POLICY profile_public_details_insert ON vport.profile_public_details
  FOR INSERT
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

CREATE POLICY profile_public_details_update ON vport.profile_public_details
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

CREATE POLICY profile_public_details_delete ON vport.profile_public_details
  FOR DELETE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));


-- ===========================================================
-- SECTION 4: vport.resources — add all CRUD policies
-- ===========================================================

CREATE POLICY resources_select ON vport.resources
  FOR SELECT
  USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));

CREATE POLICY resources_insert ON vport.resources
  FOR INSERT
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

CREATE POLICY resources_update ON vport.resources
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

CREATE POLICY resources_delete ON vport.resources
  FOR DELETE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));


-- ===========================================================
-- SECTION 5: vport.resource_services — via resources
-- ===========================================================

CREATE POLICY resource_services_select ON vport.resource_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = resource_services.resource_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), r.profile_id)
    )
  );

CREATE POLICY resource_services_insert ON vport.resource_services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = resource_services.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );

CREATE POLICY resource_services_delete ON vport.resource_services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = resource_services.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );


-- ===========================================================
-- SECTION 6: vport.availability_rules — via resources
-- ===========================================================

CREATE POLICY availability_rules_select ON vport.availability_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), r.profile_id)
    )
  );

CREATE POLICY availability_rules_insert ON vport.availability_rules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );

CREATE POLICY availability_rules_update ON vport.availability_rules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );

CREATE POLICY availability_rules_delete ON vport.availability_rules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_rules.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );


-- ===========================================================
-- SECTION 7: vport.availability_exceptions — via resources
-- ===========================================================

CREATE POLICY availability_exceptions_select ON vport.availability_exceptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_exceptions.resource_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), r.profile_id)
    )
  );

CREATE POLICY availability_exceptions_insert ON vport.availability_exceptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_exceptions.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );

CREATE POLICY availability_exceptions_update ON vport.availability_exceptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_exceptions.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_exceptions.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );

CREATE POLICY availability_exceptions_delete ON vport.availability_exceptions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.resources r
      WHERE r.id = availability_exceptions.resource_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), r.profile_id)
    )
  );


-- ===========================================================
-- SECTION 8: Reference / catalog tables — enable RLS + public read
-- service_role writes only (no INSERT policy = blocked for direct clients)
-- ===========================================================

ALTER TABLE vport.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_select_public ON vport.categories
  FOR SELECT USING (true);

ALTER TABLE vport.fuel_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY fuel_types_select_public ON vport.fuel_types
  FOR SELECT USING (true);

ALTER TABLE vport.fuel_type_localizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY fuel_type_localizations_select_public ON vport.fuel_type_localizations
  FOR SELECT USING (true);

ALTER TABLE vport.service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_catalog_select_public ON vport.service_catalog
  FOR SELECT USING (true);

ALTER TABLE vport.station_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY station_brands_select_public ON vport.station_brands
  FOR SELECT USING (true);


-- ===========================================================
-- SECTION 9: Profile-owned tables with direct profile_id
-- Enable RLS + owner manages + public read
-- ===========================================================

-- menu_categories
ALTER TABLE vport.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY menu_categories_select ON vport.menu_categories
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_categories_insert ON vport.menu_categories
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_categories_update ON vport.menu_categories
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_categories_delete ON vport.menu_categories
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- menu_items
ALTER TABLE vport.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY menu_items_select ON vport.menu_items
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_items_insert ON vport.menu_items
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_items_update ON vport.menu_items
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_items_delete ON vport.menu_items
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- menu_item_media
ALTER TABLE vport.menu_item_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY menu_item_media_select ON vport.menu_item_media
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_item_media_insert ON vport.menu_item_media
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_item_media_update ON vport.menu_item_media
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY menu_item_media_delete ON vport.menu_item_media
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- portfolio_media
ALTER TABLE vport.portfolio_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolio_media_select ON vport.portfolio_media
  FOR SELECT
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id) OR
         (vport.actor_can_view_profile(vc.current_actor_id(), profile_id) AND is_active = true));
CREATE POLICY portfolio_media_insert ON vport.portfolio_media
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY portfolio_media_update ON vport.portfolio_media
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY portfolio_media_delete ON vport.portfolio_media
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- rates
ALTER TABLE vport.rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY rates_select ON vport.rates
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY rates_insert ON vport.rates
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY rates_update ON vport.rates
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY rates_delete ON vport.rates
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- service_addons
ALTER TABLE vport.service_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_addons_select ON vport.service_addons
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY service_addons_insert ON vport.service_addons
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY service_addons_update ON vport.service_addons
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY service_addons_delete ON vport.service_addons
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- station_amenities
ALTER TABLE vport.station_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY station_amenities_select ON vport.station_amenities
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_amenities_insert ON vport.station_amenities
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_amenities_update ON vport.station_amenities
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_amenities_delete ON vport.station_amenities
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- station_contact_routes
ALTER TABLE vport.station_contact_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY station_contact_routes_select ON vport.station_contact_routes
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_contact_routes_insert ON vport.station_contact_routes
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_contact_routes_update ON vport.station_contact_routes
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_contact_routes_delete ON vport.station_contact_routes
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- station_details
ALTER TABLE vport.station_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY station_details_select ON vport.station_details
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_details_insert ON vport.station_details
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_details_update ON vport.station_details
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_details_delete ON vport.station_details
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- station_price_settings
ALTER TABLE vport.station_price_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY station_price_settings_select ON vport.station_price_settings
  FOR SELECT USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_price_settings_insert ON vport.station_price_settings
  FOR INSERT WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_price_settings_update ON vport.station_price_settings
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
CREATE POLICY station_price_settings_delete ON vport.station_price_settings
  FOR DELETE USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));


-- ===========================================================
-- SECTION 10: Fuel tables
-- ===========================================================

-- fuel_prices — public read (pricing is public info), owner updates via SECURITY DEFINER
ALTER TABLE vport.fuel_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY fuel_prices_select_public ON vport.fuel_prices
  FOR SELECT USING (true);
-- No direct INSERT/UPDATE policy — fuel price updates go through SECURITY DEFINER RPCs

-- fuel_price_history — public read for transparency, insert via SECURITY DEFINER
ALTER TABLE vport.fuel_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY fuel_price_history_select_public ON vport.fuel_price_history
  FOR SELECT USING (true);

-- fuel_price_submissions — submitter can read own, vport owner can read their profile's
ALTER TABLE vport.fuel_price_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fuel_price_submissions_select_own ON vport.fuel_price_submissions
  FOR SELECT
  USING (
    submitted_by_actor_id = vc.current_actor_id()
    OR vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
  );
CREATE POLICY fuel_price_submissions_insert_own ON vport.fuel_price_submissions
  FOR INSERT
  WITH CHECK (submitted_by_actor_id = vc.current_actor_id() AND auth.uid() IS NOT NULL);

-- fuel_price_submission_reviews — service_role only (internal moderation)
ALTER TABLE vport.fuel_price_submission_reviews ENABLE ROW LEVEL SECURITY;
-- No SELECT policy: service_role bypasses RLS by default; direct client reads are blocked


-- ===========================================================
-- SECTION 11: Portfolio detail tables — linked via portfolio_item_id
-- ===========================================================

-- portfolio_tags
ALTER TABLE vport.portfolio_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolio_tags_select ON vport.portfolio_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = portfolio_tags.portfolio_item_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), pi.profile_id)
        AND pi.is_deleted = false
    )
  );
CREATE POLICY portfolio_tags_insert ON vport.portfolio_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = portfolio_tags.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );
CREATE POLICY portfolio_tags_delete ON vport.portfolio_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = portfolio_tags.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );

-- portfolio_item_services
ALTER TABLE vport.portfolio_item_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolio_item_services_select ON vport.portfolio_item_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = portfolio_item_services.portfolio_item_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), pi.profile_id)
        AND pi.is_deleted = false
    )
  );
CREATE POLICY portfolio_item_services_insert ON vport.portfolio_item_services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = portfolio_item_services.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );
CREATE POLICY portfolio_item_services_delete ON vport.portfolio_item_services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = portfolio_item_services.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );

-- portfolio_item_metrics — owner reads own; public can read counts
ALTER TABLE vport.portfolio_item_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolio_item_metrics_select ON vport.portfolio_item_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = portfolio_item_metrics.portfolio_item_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), pi.profile_id)
        AND pi.is_deleted = false
    )
  );
-- UPDATE via SECURITY DEFINER only (engagement counters managed server-side)

-- barber_portfolio_details
ALTER TABLE vport.barber_portfolio_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY barber_portfolio_details_select ON vport.barber_portfolio_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = barber_portfolio_details.portfolio_item_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), pi.profile_id)
        AND pi.is_deleted = false
    )
  );
CREATE POLICY barber_portfolio_details_insert ON vport.barber_portfolio_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = barber_portfolio_details.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );
CREATE POLICY barber_portfolio_details_update ON vport.barber_portfolio_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = barber_portfolio_details.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = barber_portfolio_details.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );
CREATE POLICY barber_portfolio_details_delete ON vport.barber_portfolio_details
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = barber_portfolio_details.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );

-- locksmith_portfolio_details
ALTER TABLE vport.locksmith_portfolio_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY locksmith_portfolio_details_select ON vport.locksmith_portfolio_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = locksmith_portfolio_details.portfolio_item_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), pi.profile_id)
        AND pi.is_deleted = false
    )
  );
CREATE POLICY locksmith_portfolio_details_insert ON vport.locksmith_portfolio_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = locksmith_portfolio_details.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );
CREATE POLICY locksmith_portfolio_details_update ON vport.locksmith_portfolio_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = locksmith_portfolio_details.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = locksmith_portfolio_details.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );
CREATE POLICY locksmith_portfolio_details_delete ON vport.locksmith_portfolio_details
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.portfolio_items pi
      WHERE pi.id = locksmith_portfolio_details.portfolio_item_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), pi.profile_id)
    )
  );


-- ===========================================================
-- SECTION 12: Service detail tables — linked via service_id
-- ===========================================================

-- locksmith_service_details — has actor_id directly
ALTER TABLE vport.locksmith_service_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY locksmith_service_details_select ON vport.locksmith_service_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = locksmith_service_details.service_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), s.profile_id)
    )
  );
CREATE POLICY locksmith_service_details_insert ON vport.locksmith_service_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = locksmith_service_details.service_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
    )
  );
CREATE POLICY locksmith_service_details_update ON vport.locksmith_service_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = locksmith_service_details.service_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = locksmith_service_details.service_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
    )
  );
CREATE POLICY locksmith_service_details_delete ON vport.locksmith_service_details
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = locksmith_service_details.service_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
    )
  );

-- locksmith_service_areas — has actor_id (not profile_id)
ALTER TABLE vport.locksmith_service_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY locksmith_service_areas_select ON vport.locksmith_service_areas
  FOR SELECT
  USING (
    -- public can read active coverage areas; actor manages their own
    is_active = true
    OR EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = locksmith_service_areas.actor_id
        AND ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );
CREATE POLICY locksmith_service_areas_insert ON vport.locksmith_service_areas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = locksmith_service_areas.actor_id
        AND ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );
CREATE POLICY locksmith_service_areas_update ON vport.locksmith_service_areas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = locksmith_service_areas.actor_id
        AND ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = locksmith_service_areas.actor_id
        AND ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );
CREATE POLICY locksmith_service_areas_delete ON vport.locksmith_service_areas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = locksmith_service_areas.actor_id
        AND ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- service_booking_profiles
ALTER TABLE vport.service_booking_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_booking_profiles_select ON vport.service_booking_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = service_booking_profiles.service_id
        AND vport.actor_can_view_profile(vc.current_actor_id(), s.profile_id)
    )
  );
CREATE POLICY service_booking_profiles_insert ON vport.service_booking_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = service_booking_profiles.service_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
    )
  );
CREATE POLICY service_booking_profiles_update ON vport.service_booking_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = service_booking_profiles.service_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = service_booking_profiles.service_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
    )
  );
CREATE POLICY service_booking_profiles_delete ON vport.service_booking_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vport.services s
      WHERE s.id = service_booking_profiles.service_id
        AND vport.actor_can_manage_profile(vc.current_actor_id(), s.profile_id)
    )
  );


-- ===========================================================
-- SECTION 13: vport.bookings
-- Customer reads own; vport owner reads their profile's bookings
-- INSERT via SECURITY DEFINER RPC only (booking flow)
-- ===========================================================

ALTER TABLE vport.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookings_select_customer ON vport.bookings
  FOR SELECT
  USING (customer_actor_id = vc.current_actor_id());

CREATE POLICY bookings_select_vport_owner ON vport.bookings
  FOR SELECT
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

CREATE POLICY bookings_update_vport_owner ON vport.bookings
  FOR UPDATE
  USING (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));

-- Customer can cancel their own booking (status update)
CREATE POLICY bookings_update_customer ON vport.bookings
  FOR UPDATE
  USING (customer_actor_id = vc.current_actor_id())
  WITH CHECK (customer_actor_id = vc.current_actor_id());

-- DELETE locked to service_role only
-- No INSERT policy: bookings are created only via SECURITY DEFINER RPCs


-- ===========================================================
-- SECTION 14: notification.events and delivery_attempts
-- ===========================================================

-- events — actor reads events where they are the source or a recipient
CREATE POLICY notification_events_select_own ON notification.events
  FOR SELECT
  USING (
    source_actor_id = vc.current_actor_id()
    OR EXISTS (
      SELECT 1 FROM notification.recipients nr
      WHERE nr.event_id = events.id
        AND nr.recipient_actor_id = vc.current_actor_id()
    )
  );
-- INSERT: SECURITY DEFINER only — no direct client insert policy

-- delivery_attempts — service_role only (internal delivery telemetry)
-- No policies added: all direct client access blocked by RLS


-- ===========================================================
-- SECTION 15: platform schema hardening
-- All writes already go through SECURITY DEFINER RPCs.
-- Explicitly block direct client INSERT/DELETE.
-- ===========================================================

-- user_app_access
CREATE POLICY platform_user_app_access_no_direct_insert ON platform.user_app_access
  FOR INSERT WITH CHECK (false);
CREATE POLICY platform_user_app_access_no_direct_delete ON platform.user_app_access
  FOR DELETE USING (false);

-- user_app_accounts
CREATE POLICY platform_user_app_accounts_no_direct_insert ON platform.user_app_accounts
  FOR INSERT WITH CHECK (false);
CREATE POLICY platform_user_app_accounts_no_direct_delete ON platform.user_app_accounts
  FOR DELETE USING (false);

-- user_app_actor_links
CREATE POLICY platform_user_app_actor_links_no_direct_insert ON platform.user_app_actor_links
  FOR INSERT WITH CHECK (false);
CREATE POLICY platform_user_app_actor_links_no_direct_update ON platform.user_app_actor_links
  FOR UPDATE USING (false);
CREATE POLICY platform_user_app_actor_links_no_direct_delete ON platform.user_app_actor_links
  FOR DELETE USING (false);

-- user_app_preferences
CREATE POLICY platform_user_app_preferences_no_direct_insert ON platform.user_app_preferences
  FOR INSERT WITH CHECK (false);
CREATE POLICY platform_user_app_preferences_no_direct_delete ON platform.user_app_preferences
  FOR DELETE USING (false);

-- user_app_state
CREATE POLICY platform_user_app_state_no_direct_insert ON platform.user_app_state
  FOR INSERT WITH CHECK (false);
CREATE POLICY platform_user_app_state_no_direct_delete ON platform.user_app_state
  FOR DELETE USING (false);

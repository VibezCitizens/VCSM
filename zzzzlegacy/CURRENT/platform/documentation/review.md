I’m building a phase-2 review system for Vibe Citizens / vports and I want help designing the product logic, DB shape, and query strategy without breaking what already exists.

Current goal:
Build a dynamic review system where review forms change by vport type/group, each review stores dimension-level ratings, and an Overall rating is computed automatically from those dimension ratings using weights. Public UI should not show a flat list of every review row. Instead, for each citizen reviewer, only their latest review should be visible as the main card, and older reviews from that same citizen should live behind a “View old reviews” history interaction.

Core product behavior I want:
1. Review form is config-driven by vport type.
   - Example: restaurant/gas station/barber/etc each has different review dimensions.
   - These dimensions have labels, sort order, and weights.
2. Every submitted review is stored as an immutable review event.
   - Do not overwrite old reviews.
   - New review from same citizen should become the visible review card in UI.
   - Previous reviews by that same citizen should be available in history.
3. Public UI should show one visible review card per citizen reviewer, not a flat list of all reviews.
   - Latest review from that citizen is the card shown.
   - “View old reviews” opens the rest of that citizen’s history for that target.
4. There are two review lanes:
   - standard signed review
   - verified transaction review
5. Verified transaction reviews should count heavier in the official overall score because an actual transaction / booking / QR / venue interaction happened.
6. Anonymous reviews should not affect the official score.
7. Signed reviews affect official score normally.
8. Verified transaction reviews affect official score with heavier weight.
9. Overall rating per review should be computed from weighted dimension ratings.
10. Aggregate official score for the target should be computed from review overall scores, weighted by verification strength.

What already exists in DB:
- vc.vport_review_dimensions
- vc.vport_reviews
- vc.vport_review_ratings
- vc.actors
- vc.actor_owners
- vc.vports
- vc.bookings also exists and may later be used for transaction verification / completed service proof

Important existing schema direction:
- review dimensions are keyed by (vport_type, dimension_key)
- each review has target_actor_id, author_actor_id, vport_type, overall_rating, body
- each review rating row stores review_id + dimension_key + rating + vport_type
- actor ownership is resolved through vc.actor_owners, not a direct user_id on vc.actors

What is pending / what I still need:
1. Clean product/data model for latest-visible-review-per-citizen.
2. DB additions needed for verified transaction reviews.
3. DB additions needed for review history grouping / querying.
4. Query/view/rpc design to:
   - fetch latest visible review card per citizen for a target
   - fetch review history for one citizen on one target
   - fetch official aggregate score
5. Recommended columns for verification status / review kind / weighting.
6. Recommendation on whether to add a separate review thread/group table or derive history from (target_actor_id, author_actor_id).
7. Recommendation on whether booking completion / QR scan should generate a verification record table.
8. Suggested indexes for performance.
9. How to preserve immutable review history while keeping UI clean.
10. How to avoid breaking current tables while extending them for phase 2.

What I think I need in DB:
Please evaluate and improve this.

Potential additions to vc.vport_reviews:
- review_kind text not null default 'standard'
  values like: 'standard', 'verified_transaction'
- verification_weight numeric not null default 1.0
- verification_status text maybe: 'none', 'pending', 'verified'
- transaction_ref text nullable
- verification_source text maybe: 'booking', 'qr_scan', 'receipt', 'manual'
- supersedes_review_id uuid nullable
- maybe a stable history key/thread key if needed

Potential new tables:
1. vc.vport_review_verifications
   Purpose:
   store proof / source for why a review is considered verified
   Suggested columns:
   - id uuid pk
   - review_id uuid fk -> vc.vport_reviews(id)
   - verification_source text
   - booking_id uuid nullable fk -> vc.bookings(id)
   - qr_session_id uuid nullable
   - transaction_ref text nullable
   - verified_at timestamptz
   - verified_by_actor_id uuid nullable
   - meta jsonb default '{}'

2. Maybe vc.vport_review_threads or maybe no new table if grouping can be derived
   Purpose:
   optionally group all reviews from one author to one target into one UI thread
   Suggested columns if needed:
   - id uuid pk
   - target_actor_id uuid
   - author_actor_id uuid
   - latest_review_id uuid
   - latest_created_at timestamptz
   But I’m not sure if this should exist physically or just be a query/view.

3. Maybe a materialized stats table or cached stats table for official aggregates if needed later
   Example:
   vc.vport_review_stats
   - target_actor_id
   - official_overall_rating
   - official_review_count
   - verified_review_count
   - updated_at

What I want from you:
- explain the cleanest architecture for this phase-2 review system
- tell me what is already good in my current schema
- tell me what is missing
- tell me exactly which tables/columns I should add
- tell me which tables I should NOT add if they are unnecessary
- propose the final DB shape
- propose the query strategy for:
  a) latest visible review per citizen
  b) old review history per citizen
  c) official weighted overall score
- recommend indexes
- keep history immutable
- keep public UI simple
- make verified transaction reviews heavier in scoring
- preserve config-driven dimensions by vport type

Design constraints:
- do not flatten all reviews in the UI
- one visible review card per citizen reviewer
- older reviews go under “View old reviews”
- new reviews should not overwrite history
- verified transaction reviews are visually distinct and stronger in official scoring
- standard signed reviews still count
- dimensions must remain config-driven by vport type
- solution should fit Supabase/Postgres and existing vc schema

Please respond with:
1. architecture recommendation
2. pending work checklist
3. exact DB additions
4. exact tables to add vs avoid
5. query/view/rpc plan
6. indexing plan
7. official-score calculation design
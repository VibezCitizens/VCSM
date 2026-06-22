/**
 * @adapter
 * @feature authorization
 * @lastReviewed 2026-06-08
 * @blastRadius critical
 * @publicSurface approved-services
 * @requiresDeepReview true
 *
 * Platform-wide authorization gate — public surface.
 *
 * Scope:
 *   All actor ownership decisions and permission assertions.
 *   No feature may query vc.actor_owners directly except this feature,
 *   features/auth/onboarding (creation only), DB/RLS, and dev diagnostics.
 *
 * §5.3 exception basis:
 *   Authorization is a platform primitive, not feature-internal logic.
 *   Consumers call this adapter from their controllers as an approved
 *   cross-feature service boundary.
 *
 * Planned exports (future phases):
 *   assertActorCanManageActorController — delegation / management check
 *   resolveActorOwnerActorController   — resolve VPORT owner's user actor
 *
 * See plan: ZZnotforproduction/APPS/VCSM/features/authorization/AUTHORIZATION_EXTRACTION_PLAN.md
 */

export { assertActorOwnsActorController } from "@/features/authorization/controllers/assertActorOwnsActor.controller";
export { assertSessionOwnsActorController } from "@/features/authorization/controllers/assertSessionOwnsActor.controller";

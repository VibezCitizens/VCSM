/**
 * BLACKWIDOW ADVERSARIAL HARNESS
 * Findings: BW-BAR-03, BW-BAR-04 — Barbershop System Post Injection
 * Severity: HIGH
 *
 * Simulates: An authenticated attacker publishing forged system posts
 * to the public feed attributed to a victim barbershop VPORT.
 *
 * DO NOT import this from production code.
 * DO NOT deploy this file.
 * Sandboxed to development environment only.
 */

// ── Simulated actors ───────────────────────────────────────────────────────
const ATTACKER_ACTOR_ID = "attacker-actor-id-aaaa";
// Obtainable from: public profile URL, hydration store, VportBarberShopTeamView,
// or any public surface that displays the barbershop's actorId.
const VICTIM_BARBERSHOP_ACTOR_ID = "victim-barbershop-actor-id-dddd";

// ── Attack 1: Portfolio post injection ────────────────────────────────────
/**
 * ATTACK (BW-BAR-03):
 * Attacker knows VICTIM_BARBERSHOP_ACTOR_ID (public surface).
 * Attacker calls publishBarbershopPortfolioUpdateAsPostController with victim's actorId.
 * Controller has no actor_owners check.
 * A system post is published to the public feed attributed to the victim barbershop.
 *
 * Expected (SECURE) result: Error — "Caller does not own this barbershop."
 * Actual (VULNERABLE) result: Post created — feed contaminated with forged content.
 *
 * EXPECTED FIX PATTERN:
 *   export async function publishBarbershopPortfolioUpdateAsPostController({
 *     callerActorId,  // ← ADD THIS
 *     actorId,
 *     portfolioTitle,
 *     mediaUrl,
 *   }) {
 *     await assertActorOwnsVportActorController({
 *       requestActorId: callerActorId,
 *       targetActorId: actorId,
 *     });
 *     // ... rest of controller
 *   }
 */
export async function simulatePortfolioPostInjection({
  publishBarbershopPortfolioUpdateAsPostController,
}) {
  console.group("[BW-BAR-03] Portfolio System Post Injection Harness");
  console.log("Attacker session:", ATTACKER_ACTOR_ID);
  console.log("Victim barbershop actorId:", VICTIM_BARBERSHOP_ACTOR_ID);

  let result = null;
  let error = null;

  try {
    result = await publishBarbershopPortfolioUpdateAsPostController({
      actorId: VICTIM_BARBERSHOP_ACTOR_ID,
      portfolioTitle: "[HARNESS] This post was injected without ownership.",
      mediaUrl: null,
    });
  } catch (e) {
    error = e;
  }

  if (error) {
    console.log("[RESULT] BLOCKED:", error.message);
    console.log("[VERDICT] PROTECTED");
  } else if (result?.published === false) {
    console.log("[RESULT] THROTTLED — reason:", result.reason);
    console.log("[VERDICT] PARTIALLY PROTECTED — throttle only; no ownership check. Re-run after throttle window.");
  } else {
    console.warn("[RESULT] BYPASSED — post published without ownership verification.");
    console.warn("[EVIDENCE] Post ID:", result?.postId);
    console.warn("[VERDICT] VULNERABLE — forged system post now in public feed attributed to victim.");
  }

  console.groupEnd();
  return { result, error, bypassed: !error && result?.published !== false };
}

// ── Attack 2: Hours post injection ────────────────────────────────────────
/**
 * ATTACK (BW-BAR-04):
 * Identical to Attack 1, targeting publishBarbershopHoursUpdateAsPostController.
 * Attacker can publish fake hours (e.g., closed on all days) to victim barbershop's feed.
 */
export async function simulateHoursPostInjection({
  publishBarbershopHoursUpdateAsPostController,
}) {
  console.group("[BW-BAR-04] Hours System Post Injection Harness");
  console.log("Attacker session:", ATTACKER_ACTOR_ID);
  console.log("Victim barbershop actorId:", VICTIM_BARBERSHOP_ACTOR_ID);

  // Forged hours: closed every day
  const FORGED_BLOCKS = [];

  let result = null;
  let error = null;

  try {
    result = await publishBarbershopHoursUpdateAsPostController({
      actorId: VICTIM_BARBERSHOP_ACTOR_ID,
      blocks: FORGED_BLOCKS,
    });
  } catch (e) {
    error = e;
  }

  if (error) {
    console.log("[RESULT] BLOCKED:", error.message);
    console.log("[VERDICT] PROTECTED");
  } else if (result?.published === false) {
    console.log("[RESULT] THROTTLED — reason:", result.reason);
    console.log("[VERDICT] PARTIALLY PROTECTED — throttle only; re-run after throttle window.");
  } else {
    console.warn("[RESULT] BYPASSED — forged hours post published.");
    console.warn("[EVIDENCE] Post ID:", result?.postId);
    console.warn("[VERDICT] VULNERABLE — public feed now shows forged hours for victim barbershop.");
  }

  console.groupEnd();
  return { result, error, bypassed: !error && result?.published !== false };
}

// ── Throttle bypass observation ────────────────────────────────────────────
/**
 * NOTE: The throttle check (hasRecentBarbershopPortfolioPostDAL) is PER TARGET ACTOR.
 * An attacker can target N different barbershop VPORTs and inject 1 post per victim per hour.
 * The throttle does NOT protect against cross-victim attacks.
 *
 * Blast radius: Every barbershop VPORT with a known actorId.
 */
export function noteThrottleBypass() {
  console.group("[BW-BAR-03/04] Throttle Bypass Note");
  console.warn(
    "The 1-hour throttle applies per target actorId. " +
    "An attacker can inject 1 post/hour per victim barbershop. " +
    "With 100 known barbershop VPORTs, attacker can inject 100 posts per hour across the platform."
  );
  console.groupEnd();
}

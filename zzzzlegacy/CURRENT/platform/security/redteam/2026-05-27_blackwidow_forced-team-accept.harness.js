/**
 * BLACKWIDOW ADVERSARIAL HARNESS
 * Finding: BW-BAR-02 — Forced Team Request Acceptance
 * Severity: HIGH
 *
 * Simulates: An authenticated attacker using a harvested notification payload
 * to force-accept a team request on behalf of a victim barber VPORT.
 *
 * DO NOT import this from production code.
 * DO NOT deploy this file.
 * Sandboxed to development environment only.
 */

// ── Simulated actors ───────────────────────────────────────────────────────
const ATTACKER_ACTOR_ID = "attacker-actor-id-aaaa";
// Obtained from the team_invite notification linkPath:
//   /actor/{VICTIM_MEMBER_ACTOR_ID}/dashboard/team-requests
const VICTIM_MEMBER_ACTOR_ID = "victim-barber-vport-actor-id-bbbb";
// Obtained from the team_invite notification context.resourceId
const RESOURCE_ID = "pending-team-resource-id-cccc";

// ── Attack simulation ──────────────────────────────────────────────────────
/**
 * ATTACK: Attacker harvests VICTIM_MEMBER_ACTOR_ID and RESOURCE_ID from a
 * team_invite notification payload, then calls acceptTeamRequestController
 * using the victim's actorId as callerActorId.
 *
 * The controller check:
 *   String(callerActorId) !== String(resource.member_actor_id)
 * passes because the attacker supplies the correct string.
 * No session ownership verification is performed.
 *
 * Expected (SECURE) result: Error — ownership verification fails (session ≠ VPORT owner).
 * Actual (VULNERABLE) result: Team request is accepted — victim enrolled at barbershop.
 *
 * EXPECTED FIX PATTERN:
 *   // Replace string equality with:
 *   await assertActorOwnsVportActorController({
 *     requestActorId: callerActorId,
 *     targetActorId: resource.member_actor_id,
 *   });
 */
export async function simulateForcedTeamAccept({
  acceptTeamRequestController,
  readResourceById,
}) {
  console.group("[BW-BAR-02] Forced Team Request Acceptance Harness");
  console.log("Attacker session:", ATTACKER_ACTOR_ID);
  console.log("Victim member_actor_id (harvested from notification):", VICTIM_MEMBER_ACTOR_ID);
  console.log("Resource ID (harvested from notification context):", RESOURCE_ID);

  // Read pre-attack state
  const before = await readResourceById?.(RESOURCE_ID);
  console.log("Pre-attack resource status:", before?.meta?.status);

  let result = null;
  let error = null;

  try {
    // Attacker supplies VICTIM_MEMBER_ACTOR_ID as callerActorId.
    // String equality check: String("victim-bbbb") !== String("victim-bbbb") → false → passes.
    result = await acceptTeamRequestController(VICTIM_MEMBER_ACTOR_ID, RESOURCE_ID);
  } catch (e) {
    error = e;
  }

  if (error) {
    console.log("[RESULT] BLOCKED — controller rejected the call:", error.message);
    console.log("[VERDICT] PROTECTED");
  } else {
    console.warn("[RESULT] BYPASSED — acceptTeamRequestController succeeded from attacker session.");
    console.warn("[VERDICT] VULNERABLE — victim barber force-accepted into barbershop team.");

    const after = await readResourceById?.(RESOURCE_ID);
    if (after?.meta?.status === "linked") {
      console.error("[EVIDENCE] DB row status = 'linked'. EXPLOIT CONFIRMED.");
    }
  }

  console.groupEnd();
  return { result, error, bypassed: !error, before, after: result };
}

// ── Secondary: Enumerate pending requests for victim VPORT ─────────────────
/**
 * SECONDARY ATTACK: Call getBarberTeamRequestsController with victim's actorId
 * from an attacker session — harvests resourceIds and barbershopActorIds.
 *
 * Finding: BW-BAR-07
 */
export async function simulateTeamRequestEnumeration({
  getBarberTeamRequestsController,
}) {
  console.group("[BW-BAR-07] Team Request Enumeration Harness");
  console.log("Enumerating pending requests for victim VPORT:", VICTIM_MEMBER_ACTOR_ID);

  let results = null;
  let error = null;

  try {
    results = await getBarberTeamRequestsController(VICTIM_MEMBER_ACTOR_ID);
  } catch (e) {
    error = e;
  }

  if (error) {
    console.log("[RESULT] BLOCKED:", error.message);
    console.log("[VERDICT] PROTECTED");
  } else {
    console.warn("[RESULT] PARTIAL — returned", results?.length, "pending requests.");
    if (results?.length) {
      console.warn("[EVIDENCE] Harvested resourceIds:", results.map((r) => r.id));
      console.warn("[EVIDENCE] Harvested barbershopActorIds:", results.map((r) => r.barbershop?.actor_id));
    }
  }

  console.groupEnd();
  return { results, error };
}

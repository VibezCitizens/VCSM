/**
 * BLACKWIDOW ADVERSARIAL HARNESS
 * Finding: BW-BAR-01 — QR Join Identity Injection
 * Severity: CRITICAL
 *
 * Simulates: An authenticated attacker supplying an arbitrary barberVportActorId
 * to acceptQrJoin without owning that VPORT.
 *
 * DO NOT import this from production code.
 * DO NOT deploy this file.
 * Sandboxed to development environment only.
 */

// ── Simulated actor context ────────────────────────────────────────────────
const ATTACKER_SESSION = {
  userId: "attacker-user-id-xxxx",
  actorId: "attacker-actor-id-xxxx",
  kind: "user",
};

// These IDs are test-account placeholders — never real UUIDs.
const VICTIM_BARBER_VPORT_ACTOR_ID = "victim-barber-vport-actor-id-yyyy";
const QR_JOIN_TOKEN = "pending-qr-resource-id-zzzz"; // obtained by scanning QR code

// ── Attack simulation ──────────────────────────────────────────────────────
/**
 * ATTACK: Authenticated attacker accepts a QR join on behalf of a victim VPORT.
 *
 * Expected (SECURE) result: Error — "Caller does not own this barber VPORT."
 * Actual (VULNERABLE) result: Resource updated — victim VPORT force-enrolled.
 *
 * The controller acceptQrJoin(token, barberVportActorId) has NO ownership check.
 * It calls acceptJoinResourceDAL(token, barberVportActorId) directly.
 *
 * To verify the bypass:
 * 1. Create a test barbershop and a test barber VPORT in a dev Supabase instance.
 * 2. Generate a QR join token (insert a vport.resources row with meta.status = 'pending_onboarding').
 * 3. Authenticate as a DIFFERENT user (not the owner of the barber VPORT).
 * 4. Call acceptQrJoin(token, victim_barber_vport_actor_id) from that session.
 * 5. Observe: vport.resources row now has member_actor_id = victim_barber_vport_actor_id, is_active = true.
 *
 * EXPECTED FIX PATTERN:
 *   export async function acceptQrJoin(token, barberVportActorId, callerActorId) {
 *     await assertActorOwnsVportActorController({
 *       requestActorId: callerActorId,
 *       targetActorId: barberVportActorId,
 *     });
 *     return acceptJoinResourceDAL(token, barberVportActorId, {
 *       join_token_used_at: new Date().toISOString(),
 *     });
 *   }
 */
export async function simulateQrJoinInjection({
  acceptQrJoin,
  readResourceById,
}) {
  console.group("[BW-BAR-01] QR Join Identity Injection Harness");
  console.log("Attacker session:", ATTACKER_SESSION.actorId);
  console.log("Target victim VPORT:", VICTIM_BARBER_VPORT_ACTOR_ID);
  console.log("QR token:", QR_JOIN_TOKEN);

  let result = null;
  let error = null;

  try {
    // Attacker calls acceptQrJoin from their own session,
    // supplying the victim's barberVportActorId.
    result = await acceptQrJoin(QR_JOIN_TOKEN, VICTIM_BARBER_VPORT_ACTOR_ID);
  } catch (e) {
    error = e;
  }

  if (error) {
    console.log("[RESULT] BLOCKED — controller rejected the call:", error.message);
    console.log("[VERDICT] PROTECTED");
  } else {
    console.warn("[RESULT] BYPASSED — acceptQrJoin succeeded without ownership check.");
    console.warn("[VERDICT] VULNERABLE — victim VPORT was force-enrolled.");

    // Verify the mutation occurred
    const updatedResource = await readResourceById?.(QR_JOIN_TOKEN);
    if (updatedResource?.member_actor_id === VICTIM_BARBER_VPORT_ACTOR_ID) {
      console.error("[EVIDENCE] DB row confirms member_actor_id = victim VPORT. EXPLOIT CONFIRMED.");
    }
  }

  console.groupEnd();
  return { result, error, bypassed: !error };
}

// ── Replay attack (concurrent token redemption) ───────────────────────────
/**
 * SECONDARY ATTACK: Race condition — two actors accept the same QR token concurrently.
 * Last writer wins. First accepted enrollment is silently overwritten.
 */
export async function simulateQrTokenRace({
  acceptQrJoin,
  actorIdA,
  actorIdB,
}) {
  console.group("[BW-BAR-01-RACE] QR Token Concurrent Redemption Harness");

  const [resultA, resultB] = await Promise.allSettled([
    acceptQrJoin(QR_JOIN_TOKEN, actorIdA),
    acceptQrJoin(QR_JOIN_TOKEN, actorIdB),
  ]);

  console.log("Actor A result:", resultA.status, resultA.reason ?? resultA.value);
  console.log("Actor B result:", resultB.status, resultB.reason ?? resultB.value);

  if (resultA.status === "fulfilled" && resultB.status === "fulfilled") {
    console.warn("[EVIDENCE] Both accepts succeeded — race condition confirmed. One enrollment silently overwrote the other.");
  }

  console.groupEnd();
  return { resultA, resultB };
}

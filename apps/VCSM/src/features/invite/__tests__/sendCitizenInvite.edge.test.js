/**
 * Regression guard — send-citizen-invite edge function hardening
 *
 * TICKET-INVITE-ENUMERATION-HARDENING-001 / V13-L1.
 *
 * The edge function is a Deno + SES + service-role surface that cannot be executed
 * under vitest, so — following the established qrcode.spiderman.test.js precedent —
 * this asserts the hardening invariants against the function SOURCE:
 *   1. the USER_ALREADY_REGISTERED enumeration oracle is removed;
 *   2. an already-registered email returns the uniform { ok: true } success;
 *   3. the success response no longer leaks invite_id / invite_code;
 *   4. a per-inviter active-pending email-invite throttle exists and fails open;
 *   5. inviter actor_owners ownership verification is retained.
 * Runtime behavior (SES / DB) is owner-verified on deploy.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
// __tests__ → invite → features → src → apps/VCSM, then into supabase/functions.
const edgeSource = readFileSync(
  join(currentDir, "../../../../supabase/functions/send-citizen-invite/index.ts"),
  "utf8",
);

describe("send-citizen-invite enumeration hardening (V13-L1)", () => {
  it("removes the USER_ALREADY_REGISTERED enumeration oracle", () => {
    // The response differential is gone (a doc comment may still reference the name).
    expect(edgeSource).not.toMatch(/code: "USER_ALREADY_REGISTERED"/);
  });

  it("returns a uniform { ok: true } success for an already-registered email", () => {
    expect(edgeSource).toMatch(
      /if \(alreadyExists\) \{[\s\S]*?return json\(\{ ok: true \}, 200\)/,
    );
  });

  it("returns the same uniform { ok: true } success on the real-invite path", () => {
    expect(edgeSource).toMatch(/return json\(\{ ok: true \}, 200\);\s*\}\);\s*$/);
  });

  it("does not leak invite_id / invite_code in any response body", () => {
    // `json(` is used only for responses. invite_id/invite_code now live only in the
    // onboarding-steps meta + invite link, never in a response.
    expect(edgeSource).not.toMatch(/json\([\s\S]{0,80}invite_(id|code)/);
  });

  it("enforces a per-inviter active-pending email-invite throttle", () => {
    expect(edgeSource).toContain("MAX_ACTIVE_PENDING_EMAIL_INVITES");
    expect(edgeSource).toContain('.eq("inviter_actor_id", resolvedActorId)');
    expect(edgeSource).toContain('.eq("invite_channel", "email")');
    expect(edgeSource).toContain('.eq("status", "pending")');
    expect(edgeSource).toMatch(/code: "RATE_LIMITED"/);
  });

  it("fails the throttle open (never blocks a legitimate inviter on a query error)", () => {
    expect(edgeSource).toMatch(/!throttleError\s*&&/);
  });

  it("retains inviter actor_owners ownership verification", () => {
    expect(edgeSource).toContain('.from("actor_owners")');
    expect(edgeSource).toContain("VPORT_NOT_OWNED");
    expect(edgeSource).toMatch(/\.eq\("user_id", user\.id\)/);
  });
});

import { finalizeSelfHealedIdentity } from "@/state/identity/identitySelfHeal.controller";
import { debugLoginEvent } from "@debuggers/identity";

export async function runFinalizeSelfHeal({ nextIdentity }) {
  if (!nextIdentity?._engineMeta?.engineResolved) return;

  try {
    const finalizeResult = await finalizeSelfHealedIdentity(nextIdentity);

    if (finalizeResult.preferenceWritten) {
      debugLoginEvent("SELF_HEAL_PREFS_WRITE", {
        phase: "heal", status: "success",
        message: "Persisted active actor preference after self-heal",
        payload: {
          userAppAccountId: finalizeResult.userAppAccountId,
          actorLinkId: finalizeResult.actorLinkId,
          actorId: nextIdentity.actorId,
        },
      });
    }

    if (finalizeResult.stateFinalized) {
      debugLoginEvent("SELF_HEAL_STATE_FINALIZE", {
        phase: "heal", status: "success",
        message: "Account state finalized",
        payload: { userAppAccountId: finalizeResult.userAppAccountId },
      });
    } else if (finalizeResult.stateError) {
      debugLoginEvent("SELF_HEAL_STATE_FINALIZE_FAILED", {
        phase: "heal", status: "warn",
        message: "Failed to finalize state (non-fatal)",
        payload: { error: finalizeResult.stateError?.message },
      });
    }
  } catch (prefErr) {
    debugLoginEvent("SELF_HEAL_PREFS_WRITE_FAILED", {
      phase: "heal", status: "warn",
      message: "Failed to persist preference after self-heal (non-fatal)",
      payload: { error: prefErr?.message },
    });
  }
}

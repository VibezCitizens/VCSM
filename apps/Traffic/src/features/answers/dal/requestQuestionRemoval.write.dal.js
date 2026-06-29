import { getAnswersAnonClient } from "@/data/connectors/answersAnonClient";

// Anonymous question removal — REQUEST step.
//
// Invokes the service-role Edge Function send-question-removal-link, which checks
// the submitted email server-side and (only on match) emails a short-lived,
// single-use removal link. The function ALWAYS returns a generic { ok: true },
// so this DAL — and the UI above it — never learns whether the email matched.
// Invoked by name only (no VCSM app import); Traffic stays static-export safe.
export async function requestQuestionRemoval({ slug, email } = {}) {
  const client = getAnswersAnonClient();
  if (!client) return { ok: false };

  try {
    await client.functions.invoke("send-question-removal-link", {
      body: { slug, email }
    });
    return { ok: true };
  } catch {
    // Transport failure (network/CORS). The caller still shows the generic
    // message — we never surface a different outcome that could leak match state.
    return { ok: false };
  }
}

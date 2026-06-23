import { getAnswersAnonClient } from "@/data/connectors/answersAnonClient";

// Browser-safe public answer submission. Goes through the SECURITY DEFINER RPC
// answers.submit_answer, which forces draft/pending-moderation state and stores
// the contact email privately (never returned to or rendered by the public site).

export async function submitAnswerRow(input) {
  const client = getAnswersAnonClient();
  if (!client) {
    return { data: null, error: new Error("Answer submission is not available.") };
  }

  const { data, error } = await client.schema("answers").rpc("submit_answer", {
    p_question_slug: input.questionSlug,
    p_body: input.body,
    p_expert_display_name: input.expertDisplayName,
    p_expert_profile_slug: input.expertProfileSlug ?? null,
    p_expert_service_label: input.expertServiceLabel ?? null,
    p_contact_email: input.contactEmail ?? null
  });

  if (error) {
    if (error.code === "42883" || String(error.message ?? "").includes("submit_answer")) {
      return {
        data: null,
        error: new Error("Answer submission RPC is missing. Apply the answers.submit_answer migration before submitting answers.")
      };
    }
    return { data: null, error };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { data: row ?? null, error: row ? null : new Error("Answer could not be submitted.") };
}

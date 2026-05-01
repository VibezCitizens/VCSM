import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";
import { makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";

const GROUP_ID = "messaging";

export const TESTS = [
  { key: "create_conversation", name: "create conversation" },
  { key: "add_members", name: "add conversation members" },
  { key: "create_message", name: "create message" },
  { key: "create_receipt", name: "create message receipt" },
  { key: "read_inbox_entries", name: "read inbox entries" },
  { key: "participant_scoping", name: "verify participant scoping" },
];

export function getMessagingTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export function getMessagingState(shared) {
  if (!shared.cache.messagingState) {
    shared.cache.messagingState = {};
  }
  return shared.cache.messagingState;
}

export async function resolveSecondActorId({ actorId, shared }) {
  try {
    const vport = await ensureBasicVport(shared);
    if (vport?.actorId && vport.actorId !== actorId) {
      return vport.actorId;
    }
  } catch {
    // best effort
  }

  const { data, error } = await supabase
    .schema("identity")
    .from("actor_directory")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(1);

  if (error) throw error;
  return data?.[0]?.actor_id ?? null;
}

export const readInboxEntriesTest = {
  id: buildTestId(GROUP_ID, "read_inbox_entries"),
  name: "read inbox entries",
  run: async ({ shared: localShared }) => {
    const { actorId } = await ensureActorContext(localShared);

    const { data, error } = await supabase
      .schema("chat")
      .from("inbox_entries")
      .select("conversation_id,actor_id,folder,last_message_id,last_message_at,unread_count")
      .eq("actor_id", actorId)
      .order("last_message_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return {
      actorId,
      count: Array.isArray(data) ? data.length : 0,
      entries: data ?? [],
    };
  },
};

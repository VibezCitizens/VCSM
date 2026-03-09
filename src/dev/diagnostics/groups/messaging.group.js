import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";
import { ensureRealm } from "@/dev/diagnostics/helpers/ensureRealm";
import {
  isPermissionDenied,
  isSeedMissingError,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "messaging";
export const GROUP_LABEL = "Messaging";

const TESTS = [
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

function getState(shared) {
  if (!shared.cache.messagingState) {
    shared.cache.messagingState = {};
  }
  return shared.cache.messagingState;
}

async function resolveSecondActorId({ actorId, shared }) {
  try {
    const vport = await ensureBasicVport(shared);
    if (vport?.actorId && vport.actorId !== actorId) {
      return vport.actorId;
    }
  } catch {
    // best effort
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(1);

  if (error) throw error;
  return data?.[0]?.actor_id ?? null;
}

export async function runMessagingGroup({ onTestUpdate, shared }) {
  function skipIfSeedMissing(error, reason, extra = null) {
    if (!isSeedMissingError(error)) {
      throw error;
    }
    return makeSkipped(reason, {
      ...extra,
      error,
    });
  }

  const tests = [
    {
      id: buildTestId(GROUP_ID, "create_conversation"),
      name: "create conversation",
      run: async ({ shared: localShared }) => {
        let actorId;
        let userId;
        let realmId;

        try {
          const actorContext = await ensureActorContext(localShared);
          actorId = actorContext.actorId;
          userId = actorContext.userId;
          const realm = await ensureRealm(localShared);
          realmId = realm.realmId;
        } catch (error) {
          return skipIfSeedMissing(error, "create conversation blocked: required realm seed is missing");
        }
        const state = getState(localShared);

        const title = `diag-chat-${String(userId).replace(/-/g, "").slice(0, 10)}-${Date.now()}`;

        const { data, error } = await supabase
          .schema("vc")
          .from("conversations")
          .insert({
            is_group: false,
            created_by_actor_id: actorId,
            realm_id: realmId,
            title,
          })
          .select("id,is_group,created_by_actor_id,title,realm_id,last_message_id,last_message_at,created_at")
          .maybeSingle();

        if (error) throw error;

        state.conversation = data;

        return {
          conversation: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "add_members"),
      name: "add conversation members",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const state = getState(localShared);
        const conversationId = state.conversation?.id;

        if (!conversationId) {
          return makeSkipped("Conversation not created before add_members test.");
        }

        const secondActorId = await resolveSecondActorId({ actorId, shared: localShared });

        const rows = [
          {
            conversation_id: conversationId,
            actor_id: actorId,
            role: "member",
            is_active: true,
          },
        ];

        if (secondActorId && secondActorId !== actorId) {
          rows.push({
            conversation_id: conversationId,
            actor_id: secondActorId,
            role: "member",
            is_active: true,
          });
        }

        const { error: insertError } = await supabase
          .schema("vc")
          .from("conversation_members")
          .upsert(rows, { onConflict: "conversation_id,actor_id" });

        if (insertError) throw insertError;

        const { data, error: readError } = await supabase
          .schema("vc")
          .from("conversation_members")
          .select("conversation_id,actor_id,role,is_active,last_read_at")
          .eq("conversation_id", conversationId)
          .order("actor_id", { ascending: true });

        if (readError) throw readError;

        state.secondActorId = secondActorId;

        return {
          conversationId,
          secondActorId: secondActorId ?? null,
          memberCount: Array.isArray(data) ? data.length : 0,
          members: data ?? [],
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_message"),
      name: "create message",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const state = getState(localShared);
        const conversationId = state.conversation?.id;

        if (!conversationId) {
          return makeSkipped("Conversation not created before create_message test.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_actor_id: actorId,
            message_type: "text",
            body: `Diagnostics message ${Date.now()}`,
          })
          .select("id,conversation_id,sender_actor_id,message_type,body,created_at")
          .maybeSingle();

        if (error) throw error;

        state.message = data;

        await supabase
          .schema("vc")
          .from("conversations")
          .update({ last_message_id: data.id, last_message_at: data.created_at })
          .eq("id", conversationId);

        await supabase
          .schema("vc")
          .from("inbox_entries")
          .upsert(
            {
              conversation_id: conversationId,
              actor_id: actorId,
              last_message_id: data.id,
              last_message_at: data.created_at,
              folder: "inbox",
              archived: false,
              archived_until_new: false,
            },
            { onConflict: "conversation_id,actor_id" }
          );

        return {
          conversationId,
          message: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_receipt"),
      name: "create message receipt",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const state = getState(localShared);
        const messageId = state.message?.id;

        if (!messageId) {
          return makeSkipped("Message not created before create_receipt test.");
        }

        const { error: upsertError } = await supabase
          .schema("vc")
          .from("message_receipts")
          .upsert(
            {
              message_id: messageId,
              actor_id: actorId,
              status: "delivered",
            },
            { onConflict: "message_id,actor_id" }
          );

        if (upsertError) throw upsertError;

        const { data, error: readError } = await supabase
          .schema("vc")
          .from("message_receipts")
          .select("message_id,actor_id,status,seen_at,hidden_at")
          .eq("message_id", messageId)
          .eq("actor_id", actorId)
          .maybeSingle();

        if (readError) throw readError;

        return {
          messageId,
          receipt: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "read_inbox_entries"),
      name: "read inbox entries",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
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
    },
    {
      id: buildTestId(GROUP_ID, "participant_scoping"),
      name: "verify participant scoping",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const state = getState(localShared);
        const conversationId = state.conversation?.id;

        if (!conversationId) {
          return makeSkipped("Conversation not created before participant_scoping test.");
        }

        const { data: members, error: membersError } = await supabase
          .schema("vc")
          .from("conversation_members")
          .select("conversation_id,actor_id,role,is_active")
          .eq("conversation_id", conversationId)
          .order("actor_id", { ascending: true });

        if (membersError) throw membersError;

        const foreignActorId = await resolveSecondActorId({ actorId, shared: localShared });
        if (!foreignActorId || foreignActorId === actorId) {
          return makeSkipped("No foreign actor available to probe inbox scoping", {
            conversationId,
            members,
          });
        }

        const { data: foreignInboxRows, error: foreignInboxError } = await supabase
          .schema("vc")
          .from("inbox_entries")
          .select("conversation_id,actor_id,folder")
          .eq("actor_id", foreignActorId)
          .eq("conversation_id", conversationId)
          .limit(5);

        if (foreignInboxError) {
          if (isPermissionDenied(foreignInboxError)) {
            return {
              conversationId,
              members,
              permissionDeniedForForeignInboxRead: true,
            };
          }

          throw foreignInboxError;
        }

        return {
          conversationId,
          members,
          foreignActorId,
          foreignInboxRows: foreignInboxRows ?? [],
          notes:
            "Foreign inbox visibility was readable from current auth context; validate whether this is expected for your RLS model.",
        };
      },
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}

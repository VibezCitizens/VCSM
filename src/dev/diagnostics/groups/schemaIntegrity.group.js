import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicConversation, ensureBasicPost } from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  createSeedMissingError,
  isSeedMissingError,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "schemaIntegrity";
export const GROUP_LABEL = "Schema Integrity";

const TESTS = [
  { key: "public_profiles_reachable", name: "public schema reachable (profiles)" },
  { key: "vc_actors_reachable", name: "vc schema reachable (actors)" },
  { key: "vc_realms_reachable", name: "vc realms seeded rows readable" },
  { key: "actor_owner_chain", name: "actor_owners -> actors foreign key chain" },
  { key: "post_insert_read_path", name: "posts insert/read path usable" },
  { key: "conversation_member_chain", name: "conversations -> members chain usable" },
  { key: "notification_read_path", name: "notifications base read path reachable" },
];

export function getSchemaIntegrityTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runSchemaIntegrityGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "public_profiles_reachable"),
      name: "public schema reachable (profiles)",
      run: async () => {
        const { data, error, count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });

        if (error) throw error;

        return {
          count: count ?? 0,
          headQuery: true,
          data: data ?? null,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "vc_actors_reachable"),
      name: "vc schema reachable (actors)",
      run: async () => {
        const { data, error, count } = await supabase
          .schema("vc")
          .from("actors")
          .select("id", { count: "exact", head: true });

        if (error) throw error;

        return {
          count: count ?? 0,
          headQuery: true,
          data: data ?? null,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "vc_realms_reachable"),
      name: "vc realms seeded rows readable",
      run: async () => {
        const requiredRealmNames = ["public", "void"];
        const { data, error } = await supabase
          .schema("vc")
          .from("realms")
          .select("id,name,is_void,created_at")
          .in("name", requiredRealmNames)
          .order("name", { ascending: true });

        if (error) throw error;

        const hasPublic = Array.isArray(data) ? data.some((row) => row?.name === "public") : false;
        if (!hasPublic) {
          throw createSeedMissingError(
            "Required vc.realms seed 'public' is missing or not readable to this client context. Diagnostics treats realms as protected seed data and will not create rows.",
            {
              schema: "vc",
              table: "realms",
              requiredName: "public",
            }
          );
        }

        return {
          requiredRealmNames,
          rows: data ?? [],
          hasPublic,
          hasVoid: Array.isArray(data) ? data.some((row) => row?.name === "void") : false,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "actor_owner_chain"),
      name: "actor_owners -> actors foreign key chain",
      run: async ({ shared: localShared }) => {
        const { userId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("actor_owners")
          .select(
            `
            actor_id,
            user_id,
            actor:actors (
              id,
              kind,
              profile_id,
              vport_id
            )
          `
          )
          .eq("user_id", userId)
          .limit(5);

        if (error) throw error;

        return {
          ownerRows: data ?? [],
          ownerCount: Array.isArray(data) ? data.length : 0,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "post_insert_read_path"),
      name: "posts insert/read path usable",
      run: async ({ shared: localShared }) => {
        let post;
        try {
          post = await ensureBasicPost(localShared);
        } catch (error) {
          if (isSeedMissingError(error)) {
            return makeSkipped("posts insert/read path blocked: required realm seed is missing", { error });
          }
          throw error;
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("posts")
          .select("id,actor_id,text,created_at")
          .eq("id", post.id)
          .maybeSingle();

        if (error) throw error;

        return {
          seededPost: post,
          readBack: data,
          ok: Boolean(data?.id),
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "conversation_member_chain"),
      name: "conversations -> members chain usable",
      run: async ({ shared: localShared }) => {
        let conversation;
        try {
          conversation = await ensureBasicConversation(localShared);
        } catch (error) {
          if (isSeedMissingError(error)) {
            return makeSkipped("conversations/member chain blocked: required realm seed is missing", { error });
          }
          throw error;
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("conversation_members")
          .select(
            `
            conversation_id,
            actor_id,
            role,
            is_active,
            conversation:conversations (
              id,
              title,
              created_by_actor_id,
              realm_id
            )
          `
          )
          .eq("conversation_id", conversation.id);

        if (error) throw error;

        return {
          conversationId: conversation.id,
          memberCount: Array.isArray(data) ? data.length : 0,
          members: data ?? [],
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "notification_read_path"),
      name: "notifications base read path reachable",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("notifications")
          .select("id,recipient_actor_id,actor_id,kind,created_at")
          .eq("recipient_actor_id", actorId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        return {
          recipientActorId: actorId,
          sampleCount: Array.isArray(data) ? data.length : 0,
          sample: data ?? [],
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

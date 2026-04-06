import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicPost } from "@/dev/diagnostics/helpers/ensureSeedData";
import { ensureRealm } from "@/dev/diagnostics/helpers/ensureRealm";
import {
  isPermissionDenied,
  isSeedMissingError,
  isUniqueViolation,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  findForeignPostId,
  getOrCreateTestComment,
  getPostsState,
  resolveMentionTargetActor,
} from "@/dev/diagnostics/groups/posts.group.helpers";

export const GROUP_ID = "posts";
export const GROUP_LABEL = "Post / Feed";

const TESTS = [
  { key: "create_post", name: "create post" },
  { key: "read_post", name: "read post" },
  { key: "create_comment", name: "create post comment" },
  { key: "read_comments", name: "read comments for post" },
  { key: "create_reaction", name: "create post reaction" },
  { key: "update_delete_reaction", name: "update/delete post reaction" },
  { key: "create_comment_like", name: "create comment like" },
  { key: "create_post_mention", name: "create post mention" },
  { key: "create_rose_gift", name: "create rose gift" },
  { key: "actor_scope_boundary", name: "verify actor-owned post scope boundary" },
];

export function getPostsTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

function resolvePostId(localShared) {
  const state = getPostsState(localShared);
  return state.post?.id ?? null;
}

export async function runPostsGroup({ onTestUpdate, shared }) {
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
      id: buildTestId(GROUP_ID, "create_post"),
      name: "create post",
      run: async ({ shared: localShared }) => {
        let actorId;
        let userId;
        let realmId;

        try {
          const identity = await ensureActorContext(localShared);
          actorId = identity.actorId;
          userId = identity.userId;
          const realm = await ensureRealm(localShared);
          realmId = realm.realmId;
        } catch (error) {
          return skipIfSeedMissing(error, "create post blocked: required realm seed is missing");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("posts")
          .insert({
            actor_id: actorId,
            user_id: userId,
            realm_id: realmId,
            text: `Diagnostics post create ${Date.now()}`,
          })
          .select("id,actor_id,user_id,text,created_at,realm_id")
          .maybeSingle();

        if (error) throw error;

        const state = getPostsState(localShared);
        state.post = data;

        return { post: data };
      },
    },
    {
      id: buildTestId(GROUP_ID, "read_post"),
      name: "read post",
      run: async ({ shared: localShared }) => {
        let fallback;
        try {
          fallback = await ensureBasicPost(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "read post blocked: required realm seed is missing");
        }
        const postId = resolvePostId(localShared) ?? fallback.id;

        const { data, error } = await supabase
          .schema("vc")
          .from("posts")
          .select("id,actor_id,user_id,realm_id,text,title,created_at,edited_at,deleted_at")
          .eq("id", postId)
          .maybeSingle();

        if (error) throw error;

        return { postId, post: data };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_comment"),
      name: "create post comment",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let fallbackPost;
        try {
          fallbackPost = await ensureBasicPost(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "create comment blocked: required realm seed is missing");
        }
        const postId = resolvePostId(localShared) ?? fallbackPost.id;

        const comment = await getOrCreateTestComment({ postId, actorId, shared: localShared });
        return { postId, comment };
      },
    },
    {
      id: buildTestId(GROUP_ID, "read_comments"),
      name: "read comments for post",
      run: async ({ shared: localShared }) => {
        let fallbackPost;
        try {
          fallbackPost = await ensureBasicPost(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "read comments blocked: required realm seed is missing");
        }
        const postId = resolvePostId(localShared) ?? fallbackPost.id;

        const { data, error } = await supabase
          .schema("vc")
          .from("post_comments")
          .select("id,post_id,parent_id,actor_id,content,created_at,deleted_at")
          .eq("post_id", postId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) throw error;

        return {
          postId,
          count: Array.isArray(data) ? data.length : 0,
          comments: data ?? [],
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_reaction"),
      name: "create post reaction",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let fallbackPost;
        try {
          fallbackPost = await ensureBasicPost(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "create reaction blocked: required realm seed is missing");
        }
        const postId = resolvePostId(localShared) ?? fallbackPost.id;

        const { error: upsertError } = await supabase
          .schema("vc")
          .from("post_reactions")
          .upsert({ post_id: postId, actor_id: actorId, reaction: "like" }, { onConflict: "post_id,actor_id" });

        if (upsertError) throw upsertError;

        const { data, error } = await supabase
          .schema("vc")
          .from("post_reactions")
          .select("post_id,actor_id,reaction,updated_at")
          .eq("post_id", postId)
          .eq("actor_id", actorId)
          .maybeSingle();

        if (error) throw error;
        getPostsState(localShared).reaction = data;

        return { postId, actorId, reaction: data };
      },
    },
    {
      id: buildTestId(GROUP_ID, "update_delete_reaction"),
      name: "update/delete post reaction",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let fallbackPost;
        try {
          fallbackPost = await ensureBasicPost(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "update/delete reaction blocked: required realm seed is missing");
        }
        const postId = resolvePostId(localShared) ?? fallbackPost.id;

        const { error: updateError } = await supabase
          .schema("vc")
          .from("post_reactions")
          .update({ reaction: "love", updated_at: new Date().toISOString() })
          .eq("post_id", postId)
          .eq("actor_id", actorId);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .schema("vc")
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("actor_id", actorId);

        if (deleteError) throw deleteError;

        return { postId, actorId, updatedTo: "love", deleted: true };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_comment_like"),
      name: "create comment like",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let fallbackPost;
        try {
          fallbackPost = await ensureBasicPost(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "create comment like blocked: required realm seed is missing");
        }
        const postId = resolvePostId(localShared) ?? fallbackPost.id;
        const comment = await getOrCreateTestComment({ postId, actorId, shared: localShared });

        const { error: insertError } = await supabase
          .schema("vc")
          .from("comment_likes")
          .insert({ comment_id: comment.id, actor_id: actorId });

        if (insertError && !isUniqueViolation(insertError)) {
          throw insertError;
        }

        const { data, error: readError } = await supabase
          .schema("vc")
          .from("comment_likes")
          .select("comment_id,actor_id")
          .eq("comment_id", comment.id)
          .eq("actor_id", actorId)
          .maybeSingle();

        if (readError) throw readError;

        return { commentId: comment.id, actorId, row: data };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_post_mention"),
      name: "create post mention",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let fallbackPost;
        try {
          fallbackPost = await ensureBasicPost(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "create post mention blocked: required realm seed is missing");
        }
        const postId = resolvePostId(localShared) ?? fallbackPost.id;
        const mentionedActorId = await resolveMentionTargetActor({ actorId, shared: localShared });

        if (!mentionedActorId) {
          return makeSkipped("No mention target actor available");
        }

        const { error: insertError } = await supabase
          .schema("vc")
          .from("post_mentions")
          .insert({ post_id: postId, mentioned_actor_id: mentionedActorId });

        if (insertError && !isUniqueViolation(insertError)) {
          throw insertError;
        }

        const { data, error: readError } = await supabase
          .schema("vc")
          .from("post_mentions")
          .select("post_id,mentioned_actor_id")
          .eq("post_id", postId)
          .eq("mentioned_actor_id", mentionedActorId)
          .maybeSingle();

        if (readError) throw readError;
        return { postId, mentionedActorId, row: data };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_rose_gift"),
      name: "create rose gift",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let fallbackPost;
        try {
          fallbackPost = await ensureBasicPost(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "create rose gift blocked: required realm seed is missing");
        }
        const postId = resolvePostId(localShared) ?? fallbackPost.id;

        const { error: insertError } = await supabase
          .schema("vc")
          .from("post_rose_gifts")
          .insert({ post_id: postId, actor_id: actorId, qty: 1 });

        if (insertError) throw insertError;

        const { data, error: readError } = await supabase
          .schema("vc")
          .from("post_rose_gifts")
          .select("post_id,actor_id,qty,created_at")
          .eq("post_id", postId)
          .eq("actor_id", actorId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (readError) throw readError;
        return { postId, actorId, row: data };
      },
    },
    {
      id: buildTestId(GROUP_ID, "actor_scope_boundary"),
      name: "verify actor-owned post scope boundary",
      run: async ({ shared: localShared }) => {
        const { actorId, userId } = await ensureActorContext(localShared);
        const foreignPostId = await findForeignPostId({ actorId, userId });

        if (!foreignPostId) {
          return makeSkipped("No foreign post found for ownership boundary check");
        }

        const { data: beforeRow } = await supabase
          .schema("vc")
          .from("posts")
          .select("id,text")
          .eq("id", foreignPostId)
          .maybeSingle();

        const marker = `diag-boundary-${Date.now()}`;
        const { data: updatedRow, error } = await supabase
          .schema("vc")
          .from("posts")
          .update({ text: marker })
          .eq("id", foreignPostId)
          .select("id,actor_id,text")
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return { boundaryRespected: true, foreignPostId, permissionDenied: true };
          }
          throw error;
        }

        if (!updatedRow?.id) {
          return {
            boundaryRespected: true,
            foreignPostId,
            zeroRowsUpdated: true,
          };
        }

        if (beforeRow?.id) {
          await supabase
            .schema("vc")
            .from("posts")
            .update({ text: beforeRow.text ?? null })
            .eq("id", foreignPostId);
        }

        throw new Error(
          `Ownership boundary failed: diagnostics updated foreign post ${foreignPostId}.`
        );
      },
    },
  ];

  return runDiagnosticsTests({ group: GROUP_ID, tests, onTestUpdate, shared });
}

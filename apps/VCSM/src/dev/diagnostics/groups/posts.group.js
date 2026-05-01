import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicPost } from "@/dev/diagnostics/helpers/ensureSeedData";
import { ensureRealm } from "@/dev/diagnostics/helpers/ensureRealm";
import { isPermissionDenied, isUniqueViolation, makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  getOrCreateTestComment,
  getPostsState,
  resolvePostId,
  skipIfSeedMissing,
} from "@/dev/diagnostics/groups/posts.group.helpers";
import {
  actorScopeBoundaryTest,
  createPostMentionTest,
  createRoseGiftTest,
} from "@/dev/diagnostics/groups/posts.group.tests2";

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

export async function runPostsGroup({ onTestUpdate, shared }) {
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
    createPostMentionTest,
    createRoseGiftTest,
    actorScopeBoundaryTest,
  ];

  return runDiagnosticsTests({ group: GROUP_ID, tests, onTestUpdate, shared });
}

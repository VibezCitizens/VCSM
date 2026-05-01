import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicPost } from "@/dev/diagnostics/helpers/ensureSeedData";
import { isPermissionDenied, isUniqueViolation, makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  findForeignPostId,
  resolveMentionTargetActor,
  resolvePostId,
  skipIfSeedMissing,
} from "@/dev/diagnostics/groups/posts.group.helpers";

const GROUP_ID = "posts";

export const createPostMentionTest = {
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
};

export const createRoseGiftTest = {
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
};

export const actorScopeBoundaryTest = {
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
};

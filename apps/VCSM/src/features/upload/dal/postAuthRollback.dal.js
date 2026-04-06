import { supabase } from "@/services/supabase/supabaseClient";

export async function getCurrentAuthUserDAL() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user ?? null;
}

export async function deletePostByIdDAL(postId) {
  if (!postId) return;
  const { error } = await supabase
    .schema("vc")
    .from("posts")
    .delete()
    .eq("id", postId);
  if (error) throw error;
}

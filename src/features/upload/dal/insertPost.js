import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: insert post row
 * Returns raw DB result only
 */
export async function insertPost(row) {
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .insert(row)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data; // { id } | null
}

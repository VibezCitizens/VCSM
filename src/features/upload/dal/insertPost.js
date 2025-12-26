import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: insert post row
 * Returns raw DB result only
 */
export async function insertPost(row) {
  const { error } = await supabase
    .schema("vc")
    .from("posts")
    .insert(row);

  if (error) throw error;
}

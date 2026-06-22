export async function insertSample() {
  await supabase.from("samples").insert({});
  return supabase.rpc("create_sample", {});
}

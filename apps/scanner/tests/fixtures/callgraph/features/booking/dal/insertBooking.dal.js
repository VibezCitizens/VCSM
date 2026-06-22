export async function insertBookingDAL() {
  await supabase.from("bookings").insert({});
  return supabase.rpc("create_booking", {});
}

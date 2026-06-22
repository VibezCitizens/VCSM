import Booking from "@/features/booking";
import { createBooking } from "@booking";
export * from "@/features/shared";
export { createBooking as saveBooking } from "@booking";

const routes = [
  { path: "/booking/:id", element: <Booking /> },
  { path: "*" }
];

export function BookingRoutes() {
  return <Route path="/settings" element={<ProtectedRoute />} />;
}

export async function save(row) {
  await supabase.schema("vc").from("bookings").insert(row);
  await supabase.rpc("create_booking_event", {});
  await supabase.functions.invoke("send-booking-confirmation", {});
  await fetch("/api/bookings", { method: "POST", body: JSON.stringify(row) });
}

describe("booking", () => {
  it("saves", () => {});
});

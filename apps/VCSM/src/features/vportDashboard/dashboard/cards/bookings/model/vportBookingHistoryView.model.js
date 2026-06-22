// Moved from: dashboard/vport/screens/model/vportBookingHistoryView.model.js
// VPD-V-FIX-006: Model files belong in the feature model layer, not screens/model/.
// Logic is unchanged.

export function filterBookings(bookings, tab) {
  const now        = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const tmrStart   = new Date(todayEnd); tmrStart.setDate(tmrStart.getDate() + 1); tmrStart.setHours(0, 0, 0, 0);
  switch (tab) {
    case "pending":   return bookings.filter(b => b.status === "pending");
    case "upcoming":  return bookings.filter(b => { if (!b.startsAt) return false; const t = new Date(b.startsAt).getTime(); return t >= tmrStart.getTime() && !["cancelled","completed","no_show"].includes(b.status); });
    case "past":      return bookings.filter(b => { if (!b.startsAt) return false; return new Date(b.startsAt).getTime() < todayStart.getTime(); });
    case "cancelled": return bookings.filter(b => b.status === "cancelled");
    default:          return bookings;
  }
}

export function groupByDate(bookings) {
  const groups = new Map();
  for (const b of bookings) {
    const d = new Date(b.startsAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }
  return groups;
}

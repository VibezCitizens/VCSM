import { listVportBookingHistoryDAL } from "@/features/dashboard/vport/dal/read/vportBookingHistory.read.dal";

export async function listVportBookingHistoryController({ resourceId, limit = 50, offset = 0 }) {
  if (!resourceId) return [];
  return listVportBookingHistoryDAL({ resourceId, limit, offset });
}

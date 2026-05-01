import readVportServicesByActorDAL from '@/features/booking/dal/readVportServicesByActor.dal'
import { listBookingServiceProfilesByServiceIdsDAL } from '@/features/booking/dal/listBookingServiceProfilesByServiceIds.dal'

export async function readVportServicesByActor(params) {
  return readVportServicesByActorDAL(params)
}

export async function listBookingServiceProfilesByServiceIds(params) {
  return listBookingServiceProfilesByServiceIdsDAL(params)
}

import { listMyVportsDAL } from '@/features/settings/vports/dal/vports.read.dal'

export async function listMyVportsController() {
  return listMyVportsDAL()
}

import { readVportActorIdByVportIdDAL } from "@/features/profiles/kinds/vport/dal/readVportActorIdByVportId.dal";

export async function getVportActorIdByVportIdController(vportId) {
  return readVportActorIdByVportIdDAL(vportId);
}


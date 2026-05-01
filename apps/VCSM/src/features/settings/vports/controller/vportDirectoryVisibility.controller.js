import { readVportDirectoryStateDAL } from "@/features/settings/vports/dal/vports.read.dal";
import { setVportDirectoryVisibleDAL } from "@/features/settings/vports/dal/vports.write.dal";

export async function ctrlGetVportDirectoryState({ vportId }) {
  if (!vportId) return null;
  return readVportDirectoryStateDAL(vportId);
}

export async function ctrlSetVportDirectoryVisible({ vportId, visible }) {
  if (!vportId) throw new Error("vportId required");
  return setVportDirectoryVisibleDAL(vportId, Boolean(visible));
}

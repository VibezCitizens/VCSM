import { readVportBusinessCardSettingsDAL } from "@/features/settings/vports/dal/vports.read.dal";
import { setVportBusinessCardSettingsDAL } from "@/features/settings/vports/dal/vports.write.dal";

export async function ctrlGetVportBusinessCardSettings({ vportId }) {
  if (!vportId) return null;
  return readVportBusinessCardSettingsDAL(vportId);
}

export async function ctrlSetVportBusinessCardSettings({ vportId, settings }) {
  if (!vportId) throw new Error("vportId required");
  if (!settings || typeof settings !== "object") throw new Error("settings required");
  return setVportBusinessCardSettingsDAL(vportId, settings);
}

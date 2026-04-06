import readVportPublicMenuRpcDAL from "@/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal";
import { mapVportPublicMenuRpcResult } from "@/features/public/vportMenu/model/vportPublicMenu.model";

/**
 * Controller: public menu use-case boundary.
 */
export async function getVportPublicMenuController({ actorId } = {}) {
  if (!actorId) {
    throw new Error("getVportPublicMenuController: actorId is required");
  }

  const raw = await readVportPublicMenuRpcDAL({ actorId });
  return mapVportPublicMenuRpcResult(raw);
}

export default getVportPublicMenuController;

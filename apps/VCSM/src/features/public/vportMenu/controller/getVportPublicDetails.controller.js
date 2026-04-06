import readVportPublicDetailsRpcDAL from "@/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal";
import { mapVportPublicDetailsRpcResult } from "@/features/public/vportMenu/model/vportPublicDetails.model";

/**
 * Controller: public details use-case boundary.
 */
export async function getVportPublicDetailsController({ actorId } = {}) {
  if (!actorId) {
    throw new Error("getVportPublicDetailsController: actorId is required");
  }

  const raw = await readVportPublicDetailsRpcDAL({ actorId });
  return mapVportPublicDetailsRpcResult(raw);
}

export default getVportPublicDetailsController;

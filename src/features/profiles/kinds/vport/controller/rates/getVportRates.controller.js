import readVportRatesByActorDal from "@/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js";
import {
  mapVportRateRows,
  computeLastUpdated,
} from "@/features/profiles/kinds/vport/model/rates/vportRates.model.js";

export default async function getVportRatesController({
  targetActorId,
  rateType = "fx",
} = {}) {
  if (!targetActorId) {
    throw new Error("getVportRatesController: targetActorId is required");
  }

  const rows = await readVportRatesByActorDal({
    actorId: targetActorId,
    rateType,
  });

  const rates = mapVportRateRows(rows);
  const lastUpdated = computeLastUpdated(rates);

  return {
    ok: true,
    rateType,
    lastUpdated,
    rates,
  };
}
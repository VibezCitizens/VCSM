import upsertVportRateDal from "@/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

export default async function upsertVportRateController({
  identityActorId,
  actorId,
  rateType = "fx",
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
  meta = null,
} = {}) {
  if (!identityActorId) throw new Error("upsertVportRateController: identityActorId required");
  await assertActorOwnsVportActorController(identityActorId, actorId);

  return upsertVportRateDal({
    actorId,
    rateType,
    baseCurrency,
    quoteCurrency,
    buyRate,
    sellRate,
    meta,
  });
}

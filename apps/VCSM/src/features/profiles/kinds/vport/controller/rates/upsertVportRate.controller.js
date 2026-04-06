import upsertVportRateDal from "@/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js";

export default async function upsertVportRateController({
  identityActorId: _identityActorId,
  actorId,
  rateType = "fx",
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
  meta = null,
} = {}) {
  void _identityActorId;

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

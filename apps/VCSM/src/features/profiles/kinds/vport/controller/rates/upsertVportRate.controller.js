import upsertVportRateDal from "@/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js";
import { invalidateRatesCache } from "@/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

// ISO 4217 currency allow-list — extend as the platform adds new supported trading pairs.
const SUPPORTED_FX_CURRENCIES = new Set([
  "USD", "EUR", "GBP", "MXN", "CAD", "AUD", "JPY", "CHF", "CNY", "INR",
  "BRL", "KRW", "SGD", "HKD", "NOK", "SEK", "DKK", "CZK", "PLN", "HUF",
  "RON", "TRY", "ZAR", "ARS", "CLP", "COP", "PEN", "GTQ", "HNL", "NIO",
  "CRC", "PAB", "DOP", "CUP", "JMD", "TTD", "BBD", "BZD", "XCD",
]);

function assertValidRate(name, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      `upsertVportRateController: ${name} must be a positive finite number — received ${JSON.stringify(value)}`
    );
  }
  return n;
}

function assertValidCurrencyCode(name, value) {
  const code = String(value ?? "").trim().toUpperCase();
  if (!code || !SUPPORTED_FX_CURRENCIES.has(code)) {
    throw new Error(
      `upsertVportRateController: ${name} must be a supported ISO 4217 currency code — received "${code}"`
    );
  }
  return code;
}

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

  // Validate inputs before ownership check — fast-fail on malformed data.
  const validatedBase  = assertValidCurrencyCode("baseCurrency", baseCurrency);
  const validatedQuote = assertValidCurrencyCode("quoteCurrency", quoteCurrency);
  const validatedBuy   = assertValidRate("buyRate", buyRate);
  const validatedSell  = assertValidRate("sellRate", sellRate);

  if (validatedBase === validatedQuote) {
    throw new Error("upsertVportRateController: baseCurrency and quoteCurrency must differ");
  }

  await assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId });

  const result = await upsertVportRateDal({
    actorId,
    rateType,
    baseCurrency: validatedBase,
    quoteCurrency: validatedQuote,
    buyRate: validatedBuy,
    sellRate: validatedSell,
    meta,
  });

  invalidateRatesCache();
  return result;
}

export function buildLocksmithArea({
  label,
  city,
  stateCode,
  zipCode,
  radiusMiles,
  minEta,
  maxEta,
  travelFee,
  emergency,
}) {
  const areaType = zipCode ? "zip" : radiusMiles ? "radius" : "city";
  return {
    label: String(label ?? "").trim() || String(city ?? "").trim() || "Coverage area",
    areaType,
    city: String(city ?? "").trim() || null,
    stateCode: stateCode || null,
    zipCode: String(zipCode ?? "").trim() || null,
    radiusMiles: radiusMiles ? parseFloat(radiusMiles) : null,
    minEtaMinutes: minEta ? parseInt(minEta, 10) : null,
    maxEtaMinutes: maxEta ? parseInt(maxEta, 10) : null,
    travelFeeCents: travelFee ? Math.round(parseFloat(travelFee) * 100) : 0,
    isEmergencyCovered: Boolean(emergency),
  };
}

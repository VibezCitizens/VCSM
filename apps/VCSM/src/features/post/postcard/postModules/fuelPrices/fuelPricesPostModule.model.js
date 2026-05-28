const FUEL_GRADES = {
  Regular: { key: "regular", octane: "87", label: "Regular", badge: "Minimum octane rating" },
  "Mid-Grade": { key: "plus", octane: "89", label: "Plus", badge: "Minimum octane rating" },
  Premium: { key: "premium", octane: "91", label: "Premium", badge: "Minimum octane rating" },
  Diesel: { key: "diesel", octane: "No.2", label: "Diesel", badge: "Diesel fuel" },
  E85: { key: "e85", octane: "E85", label: "Flex Fuel", badge: "Ethanol blend" },
  Kerosene: { key: "kerosene", octane: "K-1", label: "Kerosene", badge: "Fuel grade" },
};

function gradeFor(label) {
  return (
    FUEL_GRADES[label] ?? {
      key: "custom",
      octane: String(label ?? "").slice(0, 3).toUpperCase(),
      label,
      badge: "Fuel grade",
    }
  );
}

function normalizeUnit(unit) {
  return String(unit ?? "").trim().toLowerCase();
}

function unitKind(unit) {
  const normalized = normalizeUnit(unit);
  if (["liter", "liters", "litre", "litres", "l"].includes(normalized)) return "liter";
  if (["gallon", "gallons", "galon", "galons", "gal", "gal."].includes(normalized)) {
    return "gallon";
  }
  return null;
}

function shortUnit(unit) {
  const kind = unitKind(unit);
  if (kind === "liter") return "L";
  if (kind === "gallon") return "gal";
  return String(unit ?? "").trim();
}

function unitPhrase(unit) {
  const kind = unitKind(unit);
  if (kind) return kind;
  const normalized = normalizeUnit(unit);
  return normalized || "unit";
}

const FUEL_KEY_LABELS = {
  regular: "Regular",
  midgrade: "Mid-Grade",
  premium: "Premium",
  diesel: "Diesel",
  e85: "E85",
  kerosene: "Kerosene",
};

const KNOWN_UNITS = new Set(["liter", "gallon"]);

function parseFuelPricesPostModuleLegacy(text) {
  const parts = (text ?? "").split("\n\n");
  const stationName = (parts[0] ?? "").replace(/^Fuel prices updated at\s*/i, "").trim();
  const rawLines = (parts[1] ?? "").split("\n").filter(Boolean);

  // New posts embed "unit:gallon" or "unit:liter" as the first line of the fuel block.
  // Old posts lack this directive — they fall back to per-fuel-line unit parsing,
  // showing "liter" as the legacy fallback.
  const unitDirective = rawLines.find((l) => /^unit:\w+$/i.test(l));
  const directiveValue = unitDirective ? unitDirective.slice(5).toLowerCase().trim() : null;
  const explicitUnit = directiveValue && KNOWN_UNITS.has(directiveValue) ? directiveValue : null;

  const prices = rawLines
    .filter((l) => !/^unit:\w+$/i.test(l))
    .map((line) => {
      const match = line.match(/^(.+?):\s+(\w+)\s+([\d.]+)\s+\/\s+(.+)$/);
      if (!match) return null;
      const grade = gradeFor(match[1].trim());
      const rawUnit = explicitUnit ?? match[4].trim();

      return {
        ...grade,
        currency: match[2],
        price: match[3],
        unit: shortUnit(rawUnit),
        unitPhrase: unitPhrase(rawUnit),
      };
    })
    .filter(Boolean);

  const uniqueUnits = [...new Set(prices.map((price) => price.unitPhrase).filter(Boolean))];
  const priceUnit = uniqueUnits.length === 1 ? uniqueUnits[0] : "unit";

  return { stationName, prices, priceUnit };
}

export function parseFuelPricesPostModule(text, payload = null) {
  if (payload?.fuels?.length) {
    const stationName = (text ?? "").replace(/^Fuel prices updated at\s*/i, "").split("\n")[0].trim();
    const prices = payload.fuels.map(({ fuelKey, price, currencyCode, unit }) => {
      const rawUnit = unit ?? payload.stationUnit ?? "liter";
      return {
        ...gradeFor(FUEL_KEY_LABELS[fuelKey] ?? fuelKey),
        currency: currencyCode ?? "USD",
        price: String(price),
        unit: shortUnit(rawUnit),
        unitPhrase: unitPhrase(rawUnit),
      };
    });
    const uniqueUnits = [...new Set(prices.map((p) => p.unitPhrase).filter(Boolean))];
    return { stationName, prices, priceUnit: uniqueUnits.length === 1 ? uniqueUnits[0] : "unit" };
  }
  return parseFuelPricesPostModuleLegacy(text);
}

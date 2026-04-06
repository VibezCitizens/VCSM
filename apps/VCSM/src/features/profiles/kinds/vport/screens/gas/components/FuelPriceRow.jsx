// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\FuelPriceRow.jsx

export function FuelPriceRow({
  fuelKey,
  price,
  currencyCode = "USD",
  unit = "liter",
  isAvailable = true,
  rightSlot = null,
  subtext = null,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div>
        <div className="text-sm text-neutral-400">{fuelKey}</div>

        <div className="mt-1 text-lg font-semibold text-white">
          {isAvailable ? (
            <>
              {price ?? "—"}{" "}
              <span className="text-sm text-neutral-300">
                {currencyCode}/{unit}
              </span>
            </>
          ) : (
            <span className="text-neutral-500">Not available</span>
          )}
        </div>

        {subtext ? (
          <div className="mt-1 text-xs text-neutral-400">{subtext}</div>
        ) : null}
      </div>

      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}
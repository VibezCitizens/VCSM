import { Fuel, Wifi, DollarSign, Image } from "lucide-react";
import { SectionCard } from "@/features/public/vportBusinessCard/view/components/BusinessCardSectionCard";

export function PortfolioSection({ portfolio }) {
  const list = Array.isArray(portfolio) ? portfolio.filter((p) => p?.media_url) : [];
  if (!list.length) return null;

  return (
    <SectionCard icon={Image} title="Portfolio">
      <div style={PS.grid}>
        {list.slice(0, 6).map((item, i) => (
          <div key={item.id ?? i} style={PS.cell}>
            <img
              src={item.media_url}
              alt={item.caption || ""}
              style={PS.img}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const PS = {
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, padding: 12 },
  cell: { aspectRatio: "1 / 1", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.04)" },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
};

export function FuelPricesSection({ fuelPrices }) {
  const list = Array.isArray(fuelPrices) ? fuelPrices.filter(Boolean) : [];
  if (!list.length) return null;

  return (
    <SectionCard icon={Fuel} title="Fuel Prices">
      <div style={{ padding: "12px 18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((fp, i) => (
          <div key={fp.fuel_type ?? i} style={FP.row}>
            <span style={FP.type}>{fp.fuel_type}</span>
            <span style={FP.price}>
              ${Number(fp.price).toFixed(3)}<span style={FP.unit}> /{fp.unit || "gal"}</span>
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const FP = {
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  type: { fontSize: 13, color: "rgba(255,255,255,0.72)", fontWeight: 600, textTransform: "capitalize" },
  price: { fontSize: 16, fontWeight: 900, color: "#fff" },
  unit: { fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.38)" },
};

export function AmenitiesSection({ amenities }) {
  const list = Array.isArray(amenities) ? amenities.filter((a) => a?.name) : [];
  if (!list.length) return null;

  return (
    <SectionCard icon={Wifi} title="Amenities">
      <div style={AM.wrap}>
        {list.map((a, i) => (
          <span key={a.name ?? i} style={AM.chip}>{a.name}</span>
        ))}
      </div>
    </SectionCard>
  );
}

const AM = {
  wrap: { padding: "12px 18px 16px", display: "flex", flexWrap: "wrap", gap: 6 },
  chip: {
    display: "inline-flex", alignItems: "center",
    padding: "4px 11px", borderRadius: 99,
    background: "rgba(124,92,255,0.12)", border: "1px solid rgba(124,92,255,0.22)",
    fontSize: 12, fontWeight: 600, color: "#c4b5fd",
  },
};

function fmtRate(val) {
  if (val == null) return "—";
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(4).replace(/(\.\d{2})0+$/, "$1");
}

function fmtUpdated(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function RatesSection({ rates }) {
  const list = Array.isArray(rates) ? rates.filter(Boolean) : [];
  if (!list.length) return null;

  return (
    <SectionCard icon={DollarSign} title="Exchange Rates">
      <div style={{ padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((r, i) => (
          <div key={`${r.currency_from}-${r.currency_to}-${i}`} style={ER.card}>
            <div style={ER.pairRow}>
              <span style={ER.pair}>{r.currency_from} / {r.currency_to}</span>
              {r.updated_at ? (
                <span style={ER.updated}>Updated {fmtUpdated(r.updated_at)}</span>
              ) : null}
            </div>
            <div style={ER.rateRow}>
              <div style={ER.col}>
                <span style={ER.label}>BUY</span>
                <span style={ER.value}>{fmtRate(r.buy_rate)}</span>
              </div>
              <div style={ER.divider} />
              <div style={ER.col}>
                <span style={ER.label}>SELL</span>
                <span style={ER.value}>{fmtRate(r.sell_rate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const ER = {
  card: {
    borderRadius: 14,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  pairRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  pair: {
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "0.4px",
  },
  updated: {
    fontSize: 10,
    fontWeight: 500,
    color: "rgba(255,255,255,0.28)",
  },
  rateRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  col: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.32)",
  },
  value: {
    fontSize: 26,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1,
    letterSpacing: "-0.5px",
  },
  divider: {
    width: 1,
    height: 40,
    background: "rgba(255,255,255,0.09)",
    flexShrink: 0,
  },
};

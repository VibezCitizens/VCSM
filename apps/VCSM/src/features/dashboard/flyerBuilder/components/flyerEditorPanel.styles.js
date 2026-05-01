export const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  outline: "none",
  fontWeight: 800,
  fontSize: 16,
};

export const label = { fontSize: 12, fontWeight: 950, opacity: 0.8 };

export const card = {
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(180deg, rgba(14,18,30,0.88), rgba(9,11,20,0.82))",
  boxShadow: "0 22px 54px rgba(0,0,0,0.42)",
  padding: 16,
  display: "grid",
  gap: 14,
};

export const hoursRow = {
  display: "grid",
  gridTemplateColumns: "56px 1fr 1fr 92px",
  gap: 10,
  alignItems: "center",
};

export const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

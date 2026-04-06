export default function CitySelector({
  value = { state: '', city: '', zip: '' },
  onChange = () => {},
}) {
  const { state, city, zip } = value

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
        Location filter
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_100px]">
        <input
          type="text"
          value={city}
          onChange={(e) => onChange({ state, city: e.target.value, zip })}
          placeholder="City (example: Austin)"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none focus:border-indigo-300/60 focus:bg-white/10"
        />

        <input
          type="text"
          maxLength={2}
          value={state}
          onChange={(e) =>
            onChange({
              state: e.target.value.toUpperCase().replace(/[^A-Z]/g, ''),
              city,
              zip,
            })
          }
          placeholder="State"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm uppercase text-white placeholder:text-white/45 outline-none focus:border-indigo-300/60 focus:bg-white/10"
        />

        <input
          type="text"
          inputMode="numeric"
          value={zip}
          onChange={(e) =>
            onChange({
              state,
              city,
              zip: e.target.value.replace(/[^0-9]/g, '').slice(0, 5),
            })
          }
          placeholder="ZIP"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none focus:border-indigo-300/60 focus:bg-white/10"
        />
      </div>

      <div className="text-xs text-white/40">City and state are enough for most nurse notes.</div>
    </div>
  )
}

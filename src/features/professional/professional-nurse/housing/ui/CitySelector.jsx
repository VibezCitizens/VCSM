import { State, City } from 'country-state-city'

export default function CitySelector({
  value = { state: '', city: '', zip: '' },
  onChange = () => {},
}) {
  const { state, city, zip } = value

  const states = State.getStatesOfCountry('US')
  const cities = state
    ? City.getCitiesOfState('US', state)
    : []

  return (
    <div className="space-y-2 max-w-3xl mx-auto">
      <div className="text-xs font-semibold text-white/70">
        Location
      </div>

      {/* FIXED-WIDTH ROW */}
      <div className="flex gap-2">
        {/* ================= STATE ================= */}
        <select
          value={state}
          onChange={(e) =>
            onChange({
              state: e.target.value,
              city: '',
              zip: '',
            })
          }
          className="
            w-[140px]
            rounded-lg
            bg-black
            border border-white/10
            px-3 py-2
            text-sm text-white
            truncate
            focus:outline-none
          "
        >
          <option value="">State</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>

        {/* ================= CITY ================= */}
        <select
          value={city}
          disabled={!state}
          onChange={(e) =>
            onChange({
              state,
              city: e.target.value,
              zip,
            })
          }
          className="
            w-[260px]
            rounded-lg
            bg-black
            border border-white/10
            px-3 py-2
            text-sm text-white
            truncate
            disabled:opacity-50
            focus:outline-none
          "
        >
          <option value="">City</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* ================= ZIP ================= */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="ZIP"
          value={zip}
          onChange={(e) =>
            onChange({
              state,
              city,
              zip: e.target.value,
            })
          }
          className="
            w-[80px]
            rounded-lg
            bg-black
            border border-white/10
            px-2 py-2
            text-sm text-white
            text-center
            focus:outline-none
          "
        />
      </div>

      <div className="text-xs text-white/40">
        City is usually enough. ZIP refines results when needed.
      </div>
    </div>
  )
}

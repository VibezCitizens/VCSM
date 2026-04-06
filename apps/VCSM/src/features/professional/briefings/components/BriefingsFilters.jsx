export default function BriefingsFilters({
  filters,
  setFilters,
  domainOptions,
}) {
  return (
    <section className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="grid gap-2 md:grid-cols-3">
        <input
          type="text"
          value={filters.query}
          onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
          placeholder="Search by title, type, domain"
          className="settings-input rounded-xl px-3 py-2 text-sm"
        />

        <select
          value={filters.domain}
          onChange={(e) => setFilters((prev) => ({ ...prev, domain: e.target.value }))}
          className="settings-input rounded-xl px-3 py-2 text-sm"
        >
          {domainOptions.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, unreadOnly: !prev.unreadOnly }))}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            filters.unreadOnly
              ? 'border-indigo-300/60 bg-indigo-300/15 text-white'
              : 'border-white/20 bg-white/[0.03] text-slate-300 hover:bg-white/10'
          }`}
        >
          {filters.unreadOnly ? 'Unread only: ON' : 'Unread only: OFF'}
        </button>
      </div>
    </section>
  )
}

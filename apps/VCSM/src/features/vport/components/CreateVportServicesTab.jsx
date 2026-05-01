import { cx } from "@/features/vport/createVportForm.model";

export function CreateVportServicesTab({
  serviceCatalog,
  catalogServices,
  groupedCatalogServices,
  selectedServiceKeys,
  toggleServiceKey,
}) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-zinc-400">
        Select the services this VPORT offers. You can edit these later.
      </div>

      {serviceCatalog.isLoading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-400">
          Loading services...
        </div>
      ) : null}

      {serviceCatalog.error ? (
        <div className="rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
          Failed to load services for this type.
        </div>
      ) : null}

      {!serviceCatalog.isLoading && !serviceCatalog.error && catalogServices.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-400">
          No catalog services found for this type.
        </div>
      ) : null}

      {!serviceCatalog.isLoading && !serviceCatalog.error && catalogServices.length > 0 ? (
        <div className="space-y-3">
          {groupedCatalogServices.map(([category, services]) => (
            <section key={category} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{category}</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {services.map((service) => {
                  const key = service?.key ?? '';
                  const selected = selectedServiceKeys.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleServiceKey(key)}
                      className={cx(
                        'rounded-xl border px-3 py-2 text-left transition-colors',
                        selected
                          ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                          : 'border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:border-zinc-500'
                      )}
                    >
                      <div className="text-sm font-medium">{service.label}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

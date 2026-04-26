import { useState } from "react";
import {
  useOrganizationWorkspace,
  useOrganizationLocations,
  useLocationResources,
} from "@/features/booking/adapters/booking.adapter";

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40 mb-2">
      {children}
    </p>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-white/4 p-4 ${className}`}>
      {children}
    </div>
  );
}

function LocationRow({ location, isSelected, onSelect }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isSelected ? "bg-purple-500/20 text-white" : "hover:bg-white/6 text-white/80"
      }`}
      onClick={() => onSelect(location)}
    >
      <span className="text-sm font-medium flex-1">{location.name}</span>
      {location.isPrimary && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-400 bg-purple-400/10 rounded-full px-2 py-0.5">
          Primary
        </span>
      )}
    </button>
  );
}

function ResourceRow({ resource }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
      <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-sm">
        {resource.resourceType === "staff" ? "👤" : resource.resourceType === "vehicle" ? "🚗" : "🪑"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{resource.name}</p>
        <p className="text-[11px] text-white/40 capitalize">{resource.resourceType}</p>
      </div>
      <span className={`w-2 h-2 rounded-full ${resource.isActive ? "bg-green-400" : "bg-white/20"}`} />
    </div>
  );
}

export function BookingOrganizationPanel({ ownerActorId }) {
  const [selectedOrgId, setSelectedOrgId]       = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  const workspace = useOrganizationWorkspace({ ownerActorId, enabled: Boolean(ownerActorId) });
  const selectedOrg = workspace.organizations.find((o) => o.id === selectedOrgId) ?? workspace.organizations[0] ?? null;
  const activeOrgId = selectedOrg?.id ?? null;

  const locationsHook = useOrganizationLocations({ organizationId: activeOrgId, enabled: Boolean(activeOrgId) });
  const selectedLocation = locationsHook.locations.find((l) => l.id === selectedLocationId) ?? locationsHook.locations[0] ?? null;
  const activeLocationId = selectedLocation?.id ?? null;

  const resourcesHook = useLocationResources({ locationId: activeLocationId, enabled: Boolean(activeLocationId) });

  if (workspace.isLoading) {
    return <p className="text-sm text-white/40 py-4 text-center">Loading workspace…</p>;
  }

  if (!workspace.organizations.length) {
    return (
      <Card>
        <p className="text-sm text-white/50 text-center py-2">No organizations yet.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {workspace.organizations.length > 1 && (
        <div>
          <SectionLabel>Organization</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {workspace.organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => { setSelectedOrgId(org.id); setSelectedLocationId(null); }}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeOrgId === org.id
                    ? "bg-purple-500/30 text-purple-300"
                    : "bg-white/6 text-white/60 hover:bg-white/10"
                }`}
              >
                {org.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedOrg && (
        <Card>
          <p className="text-sm font-semibold text-white/90 mb-0.5">{selectedOrg.name}</p>
          <p className="text-[11px] text-white/40 capitalize">{selectedOrg.organizationType}</p>
        </Card>
      )}

      {locationsHook.locations.length > 0 && (
        <div>
          <SectionLabel>Locations</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {locationsHook.locations.map((loc) => (
              <LocationRow
                key={loc.id}
                location={loc}
                isSelected={activeLocationId === loc.id}
                onSelect={(l) => setSelectedLocationId(l.id)}
              />
            ))}
          </div>
        </div>
      )}

      {activeLocationId && (
        <div>
          <SectionLabel>Staff / Resources</SectionLabel>
          {resourcesHook.isLoading ? (
            <p className="text-sm text-white/40 py-2">Loading…</p>
          ) : resourcesHook.resources.length === 0 ? (
            <p className="text-sm text-white/40 py-2">No resources at this location.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {resourcesHook.resources.map((r) => (
                <ResourceRow key={r.id} resource={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

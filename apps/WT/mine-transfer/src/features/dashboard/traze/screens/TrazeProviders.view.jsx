import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  Image as ImageIcon,
  MapPin,
  Phone,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTrazeProviders } from "@/features/dashboard/traze/hooks/useTrazeProviders";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import {
  BUSINESS_TYPE_GROUPS,
  BUSINESS_TYPES,
  labelForType,
} from "@/features/dashboard/traze/model/businessTypes.model";
import "./TrazeProviders.css";

const FILTERS = [
  { key: "all",       label: "All" },
  { key: "photo",     label: "Missing photo" },
  { key: "phone",     label: "Missing phone" },
  { key: "hours",     label: "Missing hours" },
  { key: "booking",   label: "Missing booking" },
  { key: "city",      label: "Missing city" },
  { key: "unclaimed", label: "Unclaimed" },
];

function providerGaps(provider) {
  return [
    !provider.hasAvatar && "photo",
    !provider.hasPhone && "phone",
    !provider.hasHours && "hours",
    !provider.hasBooking && "booking",
    !provider.hasCity && "city",
    !provider.hasService && "category",
  ].filter(Boolean);
}

function applyFilter(providers, filter) {
  switch (filter) {
    case "photo":     return providers.filter((p) => !p.hasAvatar);
    case "phone":     return providers.filter((p) => !p.hasPhone);
    case "hours":     return providers.filter((p) => !p.hasHours);
    case "booking":   return providers.filter((p) => !p.hasBooking);
    case "city":      return providers.filter((p) => !p.hasCity);
    case "unclaimed": return providers.filter((p) => !p.isClaimed);
    default:          return providers;
  }
}

function parseHours(hours) {
  if (!hours) return null;
  if (typeof hours === "object") return hours;
  try {
    return JSON.parse(hours);
  } catch {
    return null;
  }
}

function hoursLabel(hours) {
  const parsed = parseHours(hours);
  if (!parsed) return "Hours missing";
  if (parsed.mode === "24_7") return parsed.label || "Open 24/7";
  if (parsed.mode === "custom") return "Custom hours";
  return "Hours added";
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function initials(value) {
  const clean = String(value ?? "").trim();
  if (!clean) return "TR";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function locationLabel(provider) {
  const location = [
    provider.neighborhoodName,
    provider.cityName,
    provider.stateCode,
    provider.countryCode,
    provider.zipCode,
  ].filter(Boolean).join(", ");
  return location || "Location missing";
}

function QualityBadge({ gaps }) {
  if (!gaps.length) {
    return (
      <span className="traze-provider-badge traze-provider-badge--good">
        <CheckCircle2 size={14} />
        Complete
      </span>
    );
  }

  return (
    <span className="traze-provider-badge traze-provider-badge--alert">
      <AlertCircle size={14} />
      {gaps.length} gap{gaps.length === 1 ? "" : "s"}
    </span>
  );
}

function ProviderAvatar({ provider }) {
  if (provider.avatarUrl) {
    return (
      <img
        className="traze-provider-avatar"
        src={provider.avatarUrl}
        alt=""
        onError={(event) => { event.currentTarget.style.display = "none"; }}
      />
    );
  }

  return (
    <span className="traze-provider-avatar traze-provider-avatar--empty" aria-hidden="true">
      {initials(provider.name)}
    </span>
  );
}

function ProviderRow({ provider, actionState, onEdit, onDelete }) {
  const gaps = providerGaps(provider);
  const isBusy = actionState.id === provider.id;

  return (
    <article className="traze-provider-row">
      <ProviderAvatar provider={provider} />

      <div className="traze-provider-main">
        <div className="traze-provider-titleline">
          <h3>{provider.name ?? "Untitled provider"}</h3>
          <span className={`traze-provider-source${provider.isImportedIntake ? " traze-provider-source--intake" : ""}`}>
            {provider.sourceLabel}
          </span>
          <span className={`traze-provider-source${provider.claimStatus === "claimed" ? "" : " traze-provider-source--intake"}`}>
            {provider.claimStatus ?? "unclaimed"}
          </span>
        </div>

        <div className="traze-provider-meta">
          <span><MapPin size={14} />{locationLabel(provider)}</span>
          <span><Phone size={14} />{provider.phonePublic || "Phone missing"}</span>
          <span><Clock3 size={14} />{hoursLabel(provider.hours)}</span>
        </div>

        <div className="traze-provider-tags">
          {provider.categoryKey && <span>{labelForType(provider.categoryKey)}</span>}
          {provider.serviceName && <span>{provider.serviceName}</span>}
          {provider.countryCode && <span>{provider.countryCode}</span>}
          <span>{provider.isIndexable ? "indexable" : "not indexable"}</span>
          <span>{provider.contactHealth?.label ?? "Contact unchecked"}</span>
          <span>Added {formatDate(provider.createdAt)}</span>
          {gaps.map((gap) => <em key={gap}>Missing {gap}</em>)}
        </div>
      </div>

      <div className="traze-provider-status">
        <QualityBadge gaps={gaps} />
        {provider.isImportedIntake ? (
          <div className="traze-provider-actions">
            <button
              type="button"
              className="traze-provider-action"
              onClick={() => onEdit(provider)}
              disabled={isBusy}
            >
              <Edit3 size={15} />
              Edit
            </button>
            <button
              type="button"
              className="traze-provider-action traze-provider-action--danger"
              onClick={() => onDelete(provider)}
              disabled={isBusy}
            >
              <Trash2 size={15} />
              {isBusy && actionState.type === "delete" ? "Deleting" : "Delete"}
            </button>
          </div>
        ) : (
          <span className="traze-provider-locked">Provider index read-only</span>
        )}
      </div>
    </article>
  );
}

function EditField({ id, label, required, children }) {
  return (
    <label className="traze-provider-edit-field" htmlFor={id}>
      <span>{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

function ProviderEditModal({ provider, saving, onClose, onSave }) {
  const [draft, setDraft] = useState(() => ({
    business_name: provider.name ?? "",
    business_type: provider.categoryKey ?? "",
    city_name: provider.cityName ?? "",
    country_code: provider.countryCode ?? "",
    state_code: provider.stateCode ?? "",
    zip_code: provider.zipCode ?? "",
    address_text: provider.addressText ?? "",
    phone: provider.phonePublic ?? "",
    email: provider.email ?? "",
    website_url: provider.websiteUrl ?? "",
    google_maps_url: provider.googleMapsUrl ?? "",
    instagram_url: provider.instagramUrl ?? "",
    avatar_url: provider.avatarUrl ?? "",
    description: provider.description ?? "",
    notes: provider.notes ?? "",
  }));

  const businessTypeIsCustom = draft.business_type && !BUSINESS_TYPES.includes(draft.business_type);

  function set(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave(provider, draft);
  }

  return (
    <div className="traze-provider-modal" role="dialog" aria-modal="true" aria-labelledby="traze-provider-edit-title">
      <div className="traze-provider-modal__backdrop" onClick={onClose} />
      <form className="traze-provider-edit" onSubmit={submit}>
        <div className="traze-provider-edit__header">
          <div>
            <span>Imported intake</span>
            <h2 id="traze-provider-edit-title">Edit provider card</h2>
          </div>
          <button type="button" className="traze-provider-icon-button" onClick={onClose} aria-label="Close edit form">
            <X size={18} />
          </button>
        </div>

        <div className="traze-provider-edit__grid">
          <EditField id="edit_business_name" label="Business name" required>
            <input
              id="edit_business_name"
              value={draft.business_name}
              onChange={(event) => set("business_name", event.target.value)}
              required
            />
          </EditField>

          <EditField id="edit_business_type" label="Business type" required>
            <select
              id="edit_business_type"
              value={draft.business_type}
              onChange={(event) => set("business_type", event.target.value)}
              required
            >
              <option value="">Select business type</option>
              {businessTypeIsCustom && <option value={draft.business_type}>{labelForType(draft.business_type)}</option>}
              {Object.entries(BUSINESS_TYPE_GROUPS).map(([groupName, types]) => (
                <optgroup key={groupName} label={groupName}>
                  {types.map((type) => (
                    <option key={type} value={type}>{labelForType(type)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </EditField>

          <EditField id="edit_city_name" label="City">
            <input id="edit_city_name" value={draft.city_name} onChange={(event) => set("city_name", event.target.value)} />
          </EditField>

          <EditField id="edit_country_code" label="Country">
            <input
              id="edit_country_code"
              value={draft.country_code}
              onChange={(event) => set("country_code", event.target.value.toUpperCase())}
              maxLength={2}
            />
          </EditField>

          <EditField id="edit_state_code" label="State / region">
            <input
              id="edit_state_code"
              value={draft.state_code}
              onChange={(event) => set("state_code", event.target.value.toUpperCase())}
            />
          </EditField>

          <EditField id="edit_zip_code" label="ZIP / postal">
            <input id="edit_zip_code" value={draft.zip_code} onChange={(event) => set("zip_code", event.target.value)} />
          </EditField>

          <EditField id="edit_phone" label="Phone">
            <input id="edit_phone" value={draft.phone} onChange={(event) => set("phone", event.target.value)} />
          </EditField>

          <EditField id="edit_email" label="Email">
            <input id="edit_email" type="email" value={draft.email} onChange={(event) => set("email", event.target.value)} />
          </EditField>

          <EditField id="edit_website_url" label="Website">
            <input id="edit_website_url" type="url" value={draft.website_url} onChange={(event) => set("website_url", event.target.value)} />
          </EditField>

          <EditField id="edit_address_text" label="Street address">
            <input id="edit_address_text" value={draft.address_text} onChange={(event) => set("address_text", event.target.value)} />
          </EditField>

          <EditField id="edit_google_maps_url" label="Google Maps">
            <input id="edit_google_maps_url" type="url" value={draft.google_maps_url} onChange={(event) => set("google_maps_url", event.target.value)} />
          </EditField>

          <EditField id="edit_instagram_url" label="Instagram">
            <input id="edit_instagram_url" type="url" value={draft.instagram_url} onChange={(event) => set("instagram_url", event.target.value)} />
          </EditField>

          <EditField id="edit_avatar_url" label="Avatar URL">
            <input id="edit_avatar_url" type="url" value={draft.avatar_url} onChange={(event) => set("avatar_url", event.target.value)} />
          </EditField>

          <label className="traze-provider-edit-field traze-provider-edit-field--wide" htmlFor="edit_description">
            <span>Short description</span>
            <textarea id="edit_description" value={draft.description} onChange={(event) => set("description", event.target.value)} rows={3} />
          </label>

          <label className="traze-provider-edit-field traze-provider-edit-field--wide" htmlFor="edit_notes">
            <span>Internal notes</span>
            <textarea id="edit_notes" value={draft.notes} onChange={(event) => set("notes", event.target.value)} rows={3} />
          </label>
        </div>

        <div className="traze-provider-edit__actions">
          <button type="button" className="traze-provider-action" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="traze-provider-action traze-provider-action--primary" disabled={saving}>
            <Save size={15} />
            {saving ? "Saving" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TrazeProviders() {
  const {
    status,
    providers,
    error,
    updateImportedProvider,
    deleteImportedProvider,
  } = useTrazeProviders();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingProvider, setEditingProvider] = useState(null);
  const [actionState, setActionState] = useState({ type: null, id: null });
  const [actionError, setActionError] = useState(null);
  const [actionNote, setActionNote] = useState(null);
  const activeFilter = searchParams.get("missing") ?? "all";

  const filtered = useMemo(() => applyFilter(providers, activeFilter), [providers, activeFilter]);
  const totals = useMemo(() => {
    const withGaps = providers.filter((provider) => providerGaps(provider).length > 0).length;
    return {
      imported: providers.filter((provider) => provider.isImportedIntake).length,
      complete: providers.length - withGaps,
      withGaps,
    };
  }, [providers]);

  function setFilter(key) {
    setSearchParams(key === "all" ? {} : { missing: key });
  }

  async function handleSave(provider, draft) {
    setActionError(null);
    setActionNote(null);
    setActionState({ type: "edit", id: provider.id });
    try {
      await updateImportedProvider(provider, draft);
      setEditingProvider(null);
      setActionNote(`${draft.business_name || provider.name} updated.`);
    } catch (err) {
      setActionError(err?.message ?? "Failed to update provider.");
    } finally {
      setActionState({ type: null, id: null });
    }
  }

  async function handleDelete(provider) {
    const confirmed = window.confirm(`Delete ${provider.name}? This removes the imported intake record from this board.`);
    if (!confirmed) return;

    setActionError(null);
    setActionNote(null);
    setActionState({ type: "delete", id: provider.id });
    try {
      const result = await deleteImportedProvider(provider);
      setActionNote(result?.mode === "archived"
        ? `${provider.name} was removed from the provider board.`
        : `${provider.name} deleted.`);
    } catch (err) {
      setActionError(err?.message ?? "Failed to delete provider.");
    } finally {
      setActionState({ type: null, id: null });
    }
  }

  if (status === "loading") {
    return (
      <DashboardShell>
        <div className="traze-provider-state">Loading providers...</div>
      </DashboardShell>
    );
  }

  if (status === "error") {
    return (
      <DashboardShell>
        <div className="traze-provider-state traze-provider-state--error">
          {error?.message ?? "Failed to load providers"}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · Providers</span>
          <h1>Provider List</h1>
          <p>{providers.length} total · {filtered.length} shown</p>
        </div>
      </header>

      <section className="traze-provider-page" aria-label="Provider list">
        <div className="traze-provider-summary">
          <div>
            <span>Total records</span>
            <strong>{providers.length}</strong>
          </div>
          <div>
            <span>Imported intake</span>
            <strong>{totals.imported}</strong>
          </div>
          <div>
            <span>Need cleanup</span>
            <strong>{totals.withGaps}</strong>
          </div>
          <div>
            <span>Complete</span>
            <strong>{totals.complete}</strong>
          </div>
        </div>

        {(actionError || actionNote) && (
          <div className={`traze-provider-message${actionError ? " traze-provider-message--error" : ""}`}>
            {actionError || actionNote}
          </div>
        )}

        <div className="filter-chips" aria-label="Provider filters">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`filter-chip${activeFilter === key ? " filter-chip--active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <Panel eyebrow="Directory" title={`${filtered.length} providers`} className="panel-wide traze-provider-panel">
          {filtered.length === 0 ? (
            <div className="traze-provider-empty">
              <ImageIcon size={22} />
              <p>No providers match this filter.</p>
            </div>
          ) : (
            <div className="traze-provider-list">
              {filtered.slice(0, 60).map((provider) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  actionState={actionState}
                  onEdit={setEditingProvider}
                  onDelete={handleDelete}
                />
              ))}
              {filtered.length > 60 && (
                <p className="traze-provider-limit">
                  Showing 60 of {filtered.length}. Use filters to narrow the list.
                </p>
              )}
            </div>
          )}
        </Panel>
      </section>

      {editingProvider && (
        <ProviderEditModal
          key={editingProvider.id}
          provider={editingProvider}
          saving={actionState.type === "edit" && actionState.id === editingProvider.id}
          onClose={() => setEditingProvider(null)}
          onSave={handleSave}
        />
      )}
    </DashboardShell>
  );
}

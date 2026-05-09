import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  FileClock,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";
import { useSeedIntake } from "@/features/dashboard/traze/hooks/useSeedIntake";
import {
  EXAMPLE_SEED_MAPPING,
  toSeedSlug,
} from "@/features/traze/model/seedIntake.model";
import "./TrazeSeeds.css";

const INITIAL_FORM = {
  business_name: "",
  slug: "",
  description: "",
  status: "needs_review",
  business_type: "",
  service_id: "",
  country_code: "",
  state_code: "",
  city_name: "",
  city_slug: "",
  zip_code: "",
  neighborhood_name: "",
  neighborhood_slug: "",
  address_text: "",
  lat: "",
  lng: "",
  phone: "",
  email: "",
  website_url: "",
  instagram_url: "",
  facebook_url: "",
  google_maps_url: "",
  hours: "",
  notes: "",
  source_url: "",
};

const HEALTH_CARDS = [
  { key: "total", label: "Total seeds", detail: "Rows in seed intake", tone: "" },
  { key: "imported", label: "Imported", detail: "Linked to providers", tone: "ok" },
  { key: "missingNeighborhood", label: "Missing neighborhood", detail: "No locality or colonia", tone: "warn" },
  { key: "missingContact", label: "Missing contact", detail: "No phone, website, or maps", tone: "warn" },
];

const STATUS_OPTIONS = ["needs_review", "draft", "imported", "approved", "rejected"];

const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "None";

function compact(parts) {
  return parts.filter(Boolean).join(", ") || "Not set";
}

function Field({ label, name, value, onChange, required, error, hint, wide, children, ...inputProps }) {
  return (
    <div className={`seed-field${wide ? " seed-field--wide" : ""}`}>
      <label htmlFor={`seed-${name}`}>
        {label}{required ? " *" : ""}
      </label>
      {children ?? (
        <input
          id={`seed-${name}`}
          name={name}
          value={value}
          onChange={onChange}
          {...inputProps}
        />
      )}
      {hint ? <small>{hint}</small> : null}
      {error ? <span className="seed-field__error">{error}</span> : null}
    </div>
  );
}

function SeedHealthCard({ label, value, detail, tone }) {
  return (
    <article className={`seed-health-card${tone ? ` seed-health-card--${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function seedToForm(seed) {
  return {
    ...INITIAL_FORM,
    business_name: seed.businessName ?? "",
    slug: seed.slug ?? toSeedSlug(seed.businessName),
    description: seed.description ?? "",
    status: seed.status ?? "needs_review",
    business_type: seed.businessType ?? "",
    service_id: seed.serviceId ?? "",
    country_code: seed.countryCode ?? "",
    state_code: seed.stateCode ?? "",
    city_name: seed.cityName ?? "",
    city_slug: seed.citySlug ?? "",
    zip_code: seed.zipCode ?? "",
    neighborhood_name: seed.neighborhoodName ?? "",
    neighborhood_slug: seed.neighborhoodSlug ?? "",
    address_text: seed.addressText ?? "",
    lat: seed.lat ?? "",
    lng: seed.lng ?? "",
    phone: seed.phone ?? "",
    email: seed.email ?? "",
    website_url: seed.websiteUrl ?? "",
    instagram_url: seed.instagramUrl ?? "",
    facebook_url: seed.facebookUrl ?? "",
    google_maps_url: seed.googleMapsUrl ?? "",
    hours: seed.hours ? JSON.stringify(seed.hours, null, 2) : "",
    notes: seed.notes ?? "",
    source_url: seed.sourceUrl ?? "",
  };
}

function SeedRow({ seed, selected, onEdit }) {
  const location = compact([
    seed.neighborhoodName,
    seed.cityName,
    seed.stateCode,
    seed.countryCode,
    seed.zipCode,
  ]);
  const service = seed.businessType || seed.serviceId || "Missing service";
  const contact = compact([
    seed.phone,
    seed.websiteUrl ? "Website present" : "",
    seed.googleMapsUrl ? "Maps present" : "",
  ]);

  return (
    <article className={`seed-row${selected ? " seed-row--selected" : ""}`}>
      <div className="seed-row__stack">
        <h3>{seed.businessName}</h3>
        <div className="seed-row__meta">
          <span className={`traze-seeds__status traze-seeds__status--${seed.status}`}>
            {seed.status.replace("_", " ")}
          </span>
          <span className={service === "Missing service" ? "seed-chip seed-chip--missing" : "seed-chip"}>
            {service}
          </span>
        </div>
      </div>

      <div className="seed-row__stack">
        <span>{location}</span>
        <span>{seed.addressText || "No street address"}</span>
        {!seed.neighborhoodName && !seed.neighborhoodId ? (
          <span className="seed-chip seed-chip--missing">Missing neighborhood</span>
        ) : null}
      </div>

      <div className="seed-row__stack">
        <span>{contact}</span>
        <div className="seed-links" aria-label="Available public links">
          {seed.websiteUrl ? <span className="seed-chip"><ExternalLink size={12} /> Website</span> : null}
          {seed.googleMapsUrl ? <span className="seed-chip"><MapPin size={12} /> Maps</span> : null}
          {!seed.phone && !seed.websiteUrl && !seed.googleMapsUrl ? (
            <span className="seed-chip seed-chip--missing">Missing contact</span>
          ) : null}
        </div>
      </div>

      <div className="seed-row__stack">
        <span>Created {shortDate(seed.createdAt)}</span>
        <span>Provider {seed.importedProviderId ?? "not imported"}</span>
        <button
          className={`seed-button seed-button--compact${selected ? " seed-button--active" : ""}`}
          type="button"
          onClick={() => onEdit(seed)}
        >
          Edit
        </button>
      </div>
    </article>
  );
}

function validateSeedForm(fields) {
  const errors = {};
  if (!fields.business_name.trim()) errors.business_name = "Required";
  if (!fields.slug.trim()) errors.slug = "Required";
  if (!fields.business_type.trim()) errors.business_type = "Required";
  if (!fields.country_code.trim()) errors.country_code = "Required";
  if (!fields.state_code.trim()) errors.state_code = "Required";
  if (!fields.city_name.trim()) errors.city_name = "Required";
  if (!fields.city_slug.trim()) errors.city_slug = "Required";
  if (!fields.address_text.trim()) errors.address_text = "Required";
  if (!fields.zip_code.trim()) errors.zip_code = "Required";
  return errors;
}

export default function TrazeSeeds() {
  const { status, seeds, health, error, reload, saveSeed } = useSeedIntake();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState("");
  const [editingSeedId, setEditingSeedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredSeeds = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return seeds;
    return seeds.filter((seed) =>
      [
        seed.businessName,
        seed.businessType,
        seed.countryCode,
        seed.stateCode,
        seed.cityName,
        seed.neighborhoodName,
        seed.phone,
        seed.importedProviderId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, seeds]);

  function update(name, value) {
    const patch = { [name]: value };
    if (name === "business_name") {
      patch.business_name = value;
      patch.slug = toSeedSlug(value);
    }
    if (name === "city_name") {
      patch.city_name = value;
      patch.city_slug = toSeedSlug(value);
    }
    if (name === "neighborhood_name") {
      patch.neighborhood_name = value;
      patch.neighborhood_slug = toSeedSlug(value);
    }
    if (name === "country_code" || name === "state_code") {
      patch[name] = value.toUpperCase();
    }
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setResult("");
  }

  function editSeed(seed) {
    setEditingSeedId(seed.id);
    setForm(seedToForm(seed));
    setErrors({});
    setResult(`Editing ${seed.businessName}.`);
  }

  function resetForm() {
    setEditingSeedId(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setResult("");
  }

  function applyExample() {
    setForm((current) => ({
      ...current,
      business_name: current.business_name || "Seed business example",
      slug: current.slug || "seed-business-example",
      business_type: current.business_type || "locksmith",
      status: "needs_review",
      ...EXAMPLE_SEED_MAPPING,
    }));
    setErrors({});
    setResult("");
  }

  function handleValidate() {
    const nextErrors = validateSeedForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setResult("");
      return;
    }
    setResult("Seed record is valid. Neighborhood text is still UI-only until the table has matching columns.");
  }

  async function handleSave() {
    const nextErrors = validateSeedForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setResult("");
      return;
    }

    setSaving(true);
    setResult("");
    try {
      await saveSeed(form, editingSeedId);
      setResult(editingSeedId ? "Seed row updated." : "Seed row created.");
      resetForm();
    } catch (err) {
      setResult(err?.message ?? "Seed row could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-muted)" }}>
          Loading seed intake…
        </div>
      </DashboardShell>
    );
  }

  if (status === "error") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-rose)" }}>
          {error?.message ?? "Failed to load seed intake"}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · Seed Intake</span>
          <h1>Seed Business Management</h1>
          <p>Review real staged seed rows and prepare clean location-first business records.</p>
        </div>
        <div className="topbar-actions">
          <label className="dashboard-search">
            <Search size={17} />
            <input
              aria-label="Search seed intake"
              placeholder="Search seeds"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button className="icon-button" type="button" onClick={reload} aria-label="Refresh seed intake">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <section className="traze-seeds">
        <div className="traze-seeds__health" aria-label="Seed intake health">
          {HEALTH_CARDS.map((card) => (
            <SeedHealthCard
              key={card.key}
              label={card.label}
              value={health[card.key] ?? 0}
              detail={card.detail}
              tone={card.tone}
            />
          ))}
        </div>

        <div className="seed-intake-grid">
          <Panel
            eyebrow="Real data"
            title="Seed intake list"
            className="panel-wide"
            action={<span>{filteredSeeds.length} visible</span>}
          >
            {filteredSeeds.length ? (
              <div className="seed-table">
                {filteredSeeds.map((seed) => (
                  <SeedRow
                    key={seed.id}
                    seed={seed}
                    selected={editingSeedId === seed.id}
                    onEdit={editSeed}
                  />
                ))}
              </div>
            ) : (
              <div className="seed-form__notice">
                <Database size={20} />
                <div>
                  <strong>No seed rows found.</strong>
                  <br />
                  The page is connected to the existing anon-safe `traffic.business_intake_leads` read path.
                </div>
              </div>
            )}
          </Panel>

          <Panel
            eyebrow={editingSeedId ? "Edit staging row" : "Create staging row"}
            title={editingSeedId ? "Edit seed business" : "Add seed business"}
            action={editingSeedId ? <button className="seed-button seed-button--compact" type="button" onClick={resetForm}>New</button> : <span>staging table</span>}
          >
            <form className="seed-form" onSubmit={(event) => event.preventDefault()}>
              <div className="seed-form__notice">
                <AlertTriangle size={20} />
                <div>
                  <strong>Staging table edit.</strong>
                  <br />
                  Saves update `traffic.business_intake_leads`. Neighborhood text is shown for review, but this table stores `neighborhood_id`.
                </div>
              </div>

              <div className="seed-form__section">
                <h3>Business</h3>
                <div className="seed-form__grid">
                  <Field
                    label="Business name"
                    name="business_name"
                    value={form.business_name}
                    onChange={(event) => update("business_name", event.target.value)}
                    required
                    error={errors.business_name}
                    wide
                  />
                  <Field
                    label="Slug"
                    name="slug"
                    value={form.slug}
                    onChange={(event) => update("slug", event.target.value)}
                    required
                    error={errors.slug}
                    placeholder="business-slug"
                  />
                  <Field
                    label="Status"
                    name="status"
                    value={form.status}
                    onChange={(event) => update("status", event.target.value)}
                  >
                    <select
                      id="seed-status"
                      name="status"
                      value={form.status}
                      onChange={(event) => update("status", event.target.value)}
                    >
                      {STATUS_OPTIONS.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Service / business type"
                    name="business_type"
                    value={form.business_type}
                    onChange={(event) => update("business_type", event.target.value)}
                    required
                    error={errors.business_type}
                    placeholder="locksmith"
                  />
                  <Field
                    label="Service ID"
                    name="service_id"
                    value={form.service_id}
                    onChange={(event) => update("service_id", event.target.value)}
                    placeholder="Optional service UUID or key"
                  />
                  <Field label="Description" name="description" value={form.description} onChange={(event) => update("description", event.target.value)} wide>
                    <textarea
                      id="seed-description"
                      name="description"
                      value={form.description}
                      onChange={(event) => update("description", event.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className="seed-form__section">
                <h3>Location</h3>
                <div className="seed-form__grid">
                  <Field label="Country code" name="country_code" value={form.country_code} onChange={(event) => update("country_code", event.target.value)} required error={errors.country_code} placeholder="MX" maxLength={2} />
                  <Field label="State code" name="state_code" value={form.state_code} onChange={(event) => update("state_code", event.target.value)} required error={errors.state_code} placeholder="MEX" />
                  <Field label="City name" name="city_name" value={form.city_name} onChange={(event) => update("city_name", event.target.value)} required error={errors.city_name} placeholder="Tecamac" />
                  <Field label="City slug" name="city_slug" value={form.city_slug} onChange={(event) => update("city_slug", event.target.value)} required error={errors.city_slug} placeholder="tecamac" />
                  <Field label="ZIP / postal code" name="zip_code" value={form.zip_code} onChange={(event) => update("zip_code", event.target.value)} required error={errors.zip_code} placeholder="55740" />
                  <Field label="Neighborhood / colonia" name="neighborhood_name" value={form.neighborhood_name} onChange={(event) => update("neighborhood_name", event.target.value)} error={errors.neighborhood_name} placeholder="San Nicolas la Redonda" hint="Review-only until mapped to neighborhood_id." />
                  <Field label="Neighborhood slug" name="neighborhood_slug" value={form.neighborhood_slug} onChange={(event) => update("neighborhood_slug", event.target.value)} error={errors.neighborhood_slug} placeholder="san-nicolas-la-redonda" />
                  <Field label="Street address" name="address_text" value={form.address_text} onChange={(event) => update("address_text", event.target.value)} required error={errors.address_text} placeholder="Carr. Mexico - Pachuca Km 40.8" wide />
                  <Field label="Latitude" name="lat" value={form.lat} onChange={(event) => update("lat", event.target.value)} placeholder="Optional" hint="Optional enhancement only. Do not block intake." />
                  <Field label="Longitude" name="lng" value={form.lng} onChange={(event) => update("lng", event.target.value)} placeholder="Optional" hint="Optional enhancement only. Do not block intake." />
                </div>
              </div>

              <div className="seed-form__section">
                <h3>Contact and source</h3>
                <div className="seed-form__grid">
                  <Field label="Phone" name="phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+52..." />
                  <Field label="Email" name="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="ops@example.com" />
                  <Field label="Website" name="website_url" value={form.website_url} onChange={(event) => update("website_url", event.target.value)} placeholder="https://..." />
                  <Field label="Google Maps" name="google_maps_url" value={form.google_maps_url} onChange={(event) => update("google_maps_url", event.target.value)} placeholder="https://..." />
                  <Field label="Instagram" name="instagram_url" value={form.instagram_url} onChange={(event) => update("instagram_url", event.target.value)} placeholder="https://..." />
                  <Field label="Facebook" name="facebook_url" value={form.facebook_url} onChange={(event) => update("facebook_url", event.target.value)} placeholder="https://..." />
                  <Field label="Source URL" name="source_url" value={form.source_url} onChange={(event) => update("source_url", event.target.value)} placeholder="Internal review source" />
                  <Field label="Hours" name="hours" value={form.hours} onChange={(event) => update("hours", event.target.value)} wide>
                    <textarea
                      id="seed-hours"
                      name="hours"
                      value={form.hours}
                      onChange={(event) => update("hours", event.target.value)}
                      placeholder='Optional JSON or notes, for example {"mode":"24_7"}'
                    />
                  </Field>
                  <Field label="Notes" name="notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} wide>
                    <textarea
                      id="seed-notes"
                      name="notes"
                      value={form.notes}
                      onChange={(event) => update("notes", event.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className="seed-example">
                <strong>Mapping example</strong>
                <code>MX / MEX / Tecamac / 55740 / San Nicolas la Redonda / Carr. Mexico - Pachuca Km 40.8</code>
                <button className="seed-button" type="button" onClick={applyExample}>
                  <Plus size={15} />
                  Apply example
                </button>
              </div>

              <div className="seed-form__actions">
                <button className="seed-button seed-button--primary" type="button" onClick={handleValidate}>
                  <CheckCircle2 size={16} />
                  Validate fields
                </button>
                <button className="seed-button" type="button" onClick={handleSave} disabled={saving}>
                  <Save size={16} />
                  {saving ? "Saving" : editingSeedId ? "Save edit" : "Create seed"}
                </button>
                <span className="seed-chip">
                  <FileClock size={13} />
                  Neighborhood text pending schema
                </span>
              </div>
              {result ? <p className="seed-form__result">{result}</p> : null}
            </form>
          </Panel>
        </div>
      </section>
    </DashboardShell>
  );
}

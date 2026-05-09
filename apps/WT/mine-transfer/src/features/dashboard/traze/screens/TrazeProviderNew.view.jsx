import {
  Building2,
  CheckCircle2,
  Clock3,
  Contact,
  FileText,
  Globe2,
  Image,
  MapPin,
  Save,
} from "lucide-react";
import { useIntakeForm } from "@/features/dashboard/traze/hooks/useIntakeForm";
import { useCityOptions } from "@/features/dashboard/traze/hooks/useCityOptions";
import { useServiceOptions } from "@/features/dashboard/traze/hooks/useServiceOptions";
import {
  BUSINESS_TYPE_GROUPS,
  BUSINESS_TYPES,
  labelForType,
  serviceKeyCandidates,
} from "@/features/dashboard/traze/model/businessTypes.model";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import "./TrazeProviderNew.css";

const HOURS_DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

function Field({ id, label, error, required, span = 6, children, hint }) {
  return (
    <div className={`traze-form-field traze-form-field--span-${span} ${error ? "traze-form-field--error" : ""}`}>
      <label className="traze-form-label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && <p className="traze-form-hint">{hint}</p>}
      {error && <span className="traze-form-error" role="alert">{error}</span>}
    </div>
  );
}

function FormSection({ icon: Icon, eyebrow, title, children }) {
  return (
    <section className="traze-form-section">
      <div className="traze-form-section__header">
        <span className="traze-form-section__icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="traze-form-grid">{children}</div>
    </section>
  );
}

function ReadinessItem({ complete, label }) {
  return (
    <li className={complete ? "is-complete" : ""}>
      <CheckCircle2 size={15} />
      <span>{label}</span>
    </li>
  );
}

export default function TrazeProviderNew() {
  const { fields, errors, submit, set, setMany, saveDraft, approveAndCreate, createUnlisted } = useIntakeForm();
  const { cities } = useCityOptions();
  const { services } = useServiceOptions();

  const busy = submit.status === "submitting";
  const businessTypeIsCustom = fields.business_type && !BUSINESS_TYPES.includes(fields.business_type);
  const hasManualLocation = Boolean(fields.city_name.trim() && fields.country_code.trim());

  function applyBusinessType(type) {
    const candidates = serviceKeyCandidates(type);
    const matchedService = services.find((service) => {
      const slug = String(service?.slug ?? "").trim().toLowerCase();
      const name = String(service?.name ?? "").trim().toLowerCase();
      return candidates.includes(slug) || candidates.includes(name);
    });

    setMany({
      business_type: type,
      ...(matchedService && !fields.service_id ? { service_id: matchedService.id } : {}),
    });
  }

  function applyKnownCity(cityId) {
    if (!cityId) {
      setMany({ city_id: "" });
      return;
    }

    const city = cities.find((item) => item.id === cityId);
    setMany({
      city_id: cityId,
      city_name: city?.name ?? "",
      state_code: city?.state_code ?? "",
      country_code: city?.country_code ?? "",
    });
  }

  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · Intake</span>
          <h1>New Business</h1>
          <p>Capture clean provider details for the intake queue.</p>
        </div>
      </header>

      <section className="traze-new-business" aria-label="New business form">
        <form className="traze-form-card" onSubmit={(event) => event.preventDefault()}>
          <div className="traze-form-card__heading">
            <div>
              <span>Business intake</span>
              <h2>Provider candidate</h2>
            </div>
            <p>Private staging record</p>
          </div>

          <div className="traze-form-layout">
            <div className="traze-form-main">
              <FormSection icon={Building2} eyebrow="Identity" title="Business details">
                <Field id="business_name" label="Business name" required error={errors.business_name} span={6}>
                  <input
                    id="business_name"
                    className="traze-input"
                    value={fields.business_name}
                    onChange={(e) => set("business_name", e.target.value)}
                    placeholder="Casa De Cambio"
                    autoComplete="organization"
                  />
                </Field>

                <Field id="business_type" label="Business type" required error={errors.business_type} span={3}>
                  <select
                    id="business_type"
                    className="traze-input"
                    value={fields.business_type}
                    onChange={(e) => applyBusinessType(e.target.value)}
                  >
                    <option value="">Select business type</option>
                    {businessTypeIsCustom && <option value={fields.business_type}>{labelForType(fields.business_type)}</option>}
                    {Object.entries(BUSINESS_TYPE_GROUPS).map(([groupName, types]) => (
                      <optgroup key={groupName} label={groupName}>
                        {types.map((type) => (
                          <option key={type} value={type}>{labelForType(type)}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>

                <Field id="service_id" label="Primary service" span={3}>
                  <select
                    id="service_id"
                    className="traze-input"
                    value={fields.service_id}
                    onChange={(e) => set("service_id", e.target.value)}
                  >
                    <option value="">{services.length ? "Optional service" : "No services loaded"}</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}{service.category ? ` (${service.category})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="description" label="Short description" span={12}>
                  <textarea
                    id="description"
                    className="traze-input traze-input--textarea"
                    value={fields.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Local business serving customers nearby."
                    rows={4}
                  />
                </Field>

                <Field id="price_notes" label="Price notes" span={12}>
                  <input
                    id="price_notes"
                    className="traze-input"
                    value={fields.price_notes}
                    onChange={(e) => set("price_notes", e.target.value)}
                    placeholder="Free estimates, service call fee, or menu notes"
                  />
                </Field>
              </FormSection>

              <FormSection icon={MapPin} eyebrow="Market" title="Location">
                <Field id="city_id" label="Known city" error={errors.city_id} span={6}>
                  <select
                    id="city_id"
                    className="traze-input"
                    value={fields.city_id}
                    onChange={(e) => applyKnownCity(e.target.value)}
                  >
                    <option value="">Manual city entry</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}{city.state_code ? `, ${city.state_code}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="city_name" label="City name" required error={errors.city_name} span={6}>
                  <input
                    id="city_name"
                    className="traze-input"
                    value={fields.city_name}
                    onChange={(e) => set("city_name", e.target.value)}
                    placeholder="Los Angeles"
                    autoComplete="address-level2"
                  />
                </Field>

                <Field id="address_text" label="Street address" span={12}>
                  <input
                    id="address_text"
                    className="traze-input"
                    value={fields.address_text}
                    onChange={(e) => set("address_text", e.target.value)}
                    placeholder="123 Main St"
                    autoComplete="street-address"
                  />
                </Field>

                <Field id="country_code" label="Country code" required error={errors.country_code} span={4}>
                  <input
                    id="country_code"
                    className="traze-input"
                    value={fields.country_code}
                    onChange={(e) => set("country_code", e.target.value.toUpperCase())}
                    maxLength={2}
                    placeholder="US"
                    autoComplete="country"
                  />
                </Field>

                <Field id="state_code" label="State / region" span={4}>
                  <input
                    id="state_code"
                    className="traze-input"
                    value={fields.state_code}
                    onChange={(e) => set("state_code", e.target.value.toUpperCase())}
                    placeholder="CA"
                    autoComplete="address-level1"
                  />
                </Field>

                <Field id="zip_code" label="ZIP / postal code" span={4}>
                  <input
                    id="zip_code"
                    className="traze-input"
                    value={fields.zip_code}
                    onChange={(e) => set("zip_code", e.target.value)}
                    placeholder="90012"
                    autoComplete="postal-code"
                  />
                </Field>
              </FormSection>

              <FormSection icon={Contact} eyebrow="Contact" title="Business contact">
                <Field id="phone" label="Phone" span={4}>
                  <input
                    id="phone"
                    className="traze-input"
                    value={fields.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                    autoComplete="tel"
                  />
                </Field>

                <Field id="email" label="Email" span={4}>
                  <input
                    id="email"
                    className="traze-input"
                    value={fields.email}
                    onChange={(e) => set("email", e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </Field>

                <Field id="website_url" label="Website URL" span={4}>
                  <input
                    id="website_url"
                    className="traze-input"
                    value={fields.website_url}
                    onChange={(e) => set("website_url", e.target.value)}
                    type="url"
                    placeholder="https://..."
                    autoComplete="url"
                  />
                </Field>
              </FormSection>

              <FormSection icon={Globe2} eyebrow="Discovery" title="Maps and social">
                <Field id="google_maps_url" label="Google Maps URL" span={4}>
                  <input
                    id="google_maps_url"
                    className="traze-input"
                    value={fields.google_maps_url}
                    onChange={(e) => set("google_maps_url", e.target.value)}
                    type="url"
                  />
                </Field>

                <Field id="instagram_url" label="Instagram URL" span={4}>
                  <input
                    id="instagram_url"
                    className="traze-input"
                    value={fields.instagram_url}
                    onChange={(e) => set("instagram_url", e.target.value)}
                    type="url"
                  />
                </Field>

                <Field id="facebook_url" label="Facebook URL" span={4}>
                  <input
                    id="facebook_url"
                    className="traze-input"
                    value={fields.facebook_url}
                    onChange={(e) => set("facebook_url", e.target.value)}
                    type="url"
                  />
                </Field>
              </FormSection>

              <FormSection icon={Image} eyebrow="Media" title="Profile assets">
                <Field id="avatar_url" label="Avatar URL" span={4}>
                  <input
                    id="avatar_url"
                    className="traze-input"
                    value={fields.avatar_url}
                    onChange={(e) => set("avatar_url", e.target.value)}
                    type="url"
                  />
                </Field>

                <Field id="banner_url" label="Banner URL" span={4}>
                  <input
                    id="banner_url"
                    className="traze-input"
                    value={fields.banner_url}
                    onChange={(e) => set("banner_url", e.target.value)}
                    type="url"
                  />
                </Field>

                <Field id="logo_url" label="Logo URL" span={4}>
                  <input
                    id="logo_url"
                    className="traze-input"
                    value={fields.logo_url}
                    onChange={(e) => set("logo_url", e.target.value)}
                    type="url"
                  />
                </Field>
              </FormSection>

              <FormSection icon={Clock3} eyebrow="Operations" title="Hours and notes">
                <div className="traze-form-field traze-form-field--span-12">
                  <label className="traze-hours-toggle">
                    <input
                      type="checkbox"
                      checked={fields.hours_mode === "24_7"}
                      onChange={(e) => set("hours_mode", e.target.checked ? "24_7" : "custom")}
                    />
                    <span>Open 24/7</span>
                  </label>
                </div>

                {fields.hours_mode !== "24_7" && (
                  <div className="traze-hours-grid">
                    {HOURS_DAYS.map((day) => {
                      const closedKey = `${day.key}_closed`;
                      const openKey = `${day.key}_open`;
                      const closeKey = `${day.key}_close`;
                      const isClosed = Boolean(fields[closedKey]);

                      return (
                        <div className="traze-hours-row" key={day.key}>
                          <span className="traze-hours-row__day">{day.label}</span>
                          <input
                            className="traze-input traze-input--time"
                            type="time"
                            value={fields[openKey]}
                            onChange={(e) => set(openKey, e.target.value)}
                            disabled={isClosed}
                            aria-label={`${day.label} open time`}
                          />
                          <span className="traze-hours-row__dash">to</span>
                          <input
                            className="traze-input traze-input--time"
                            type="time"
                            value={fields[closeKey]}
                            onChange={(e) => set(closeKey, e.target.value)}
                            disabled={isClosed}
                            aria-label={`${day.label} close time`}
                          />
                          <label className="traze-hours-row__closed">
                            <input
                              type="checkbox"
                              checked={isClosed}
                              onChange={(e) => setMany({
                                [closedKey]: e.target.checked,
                                ...(e.target.checked ? { [openKey]: "", [closeKey]: "" } : {}),
                              })}
                            />
                            Closed
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Field id="source_url" label="Source URL" span={6}>
                  <input
                    id="source_url"
                    className="traze-input"
                    value={fields.source_url}
                    onChange={(e) => set("source_url", e.target.value)}
                    type="url"
                    placeholder="https://..."
                  />
                </Field>

                <Field id="notes" label="Internal notes" span={6}>
                  <input
                    id="notes"
                    className="traze-input"
                    value={fields.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
              </FormSection>
            </div>

            <aside className="traze-form-side" aria-label="Intake readiness">
              <div className="traze-form-side__panel">
                <span className="traze-form-side__eyebrow">Readiness</span>
                <h2>Intake checks</h2>
                <ul>
                  <ReadinessItem complete={Boolean(fields.business_name.trim())} label="Business name" />
                  <ReadinessItem complete={Boolean(fields.business_type.trim())} label="Business type" />
                  <ReadinessItem complete={Boolean(fields.city_id) || hasManualLocation} label="City and country" />
                </ul>
              </div>

              <div className="traze-form-side__panel">
                <span className="traze-form-side__eyebrow">Source</span>
                <h2>Staging record</h2>
                <p>Awaiting review.</p>
              </div>
            </aside>
          </div>

          {submit.status === "error" && (
            <p className="traze-form-submit-error">
              {submit.error?.message ?? "Submit failed. Check the fields and try again."}
            </p>
          )}

          <div className="traze-form-actions">
            <button className="traze-form-button traze-form-button--secondary" type="button" onClick={saveDraft} disabled={busy}>
              <Save size={16} />
              {busy ? "Saving" : "Save draft"}
            </button>
            <button className="traze-form-button traze-form-button--ghost" type="button" onClick={createUnlisted} disabled={busy}>
              <FileText size={16} />
              {busy ? "Creating" : "Create indexed"}
            </button>
            <button className="traze-form-button traze-form-button--primary" type="button" onClick={approveAndCreate} disabled={busy}>
              <FileText size={16} />
              {busy ? "Creating" : "Approve and create"}
            </button>
          </div>
        </form>
      </section>
    </DashboardShell>
  );
}

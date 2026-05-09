import { useCallback, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveDraftIntakeLead,
  convertLeadToProvider,
} from "@/features/dashboard/traze/controllers/intake.controller";

const HOURS_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const INITIAL_FIELDS = {
  business_name: "", business_type: "", service_id: "", city_id: "",
  city_name: "", city_slug: "", country_code: "", state_code: "", zip_code: "",
  description: "", phone: "", email: "", website_url: "",
  address_text: "", lat: "", lng: "",
  hours_mode: "custom",
  monday_open: "", monday_close: "", monday_closed: false,
  tuesday_open: "", tuesday_close: "", tuesday_closed: false,
  wednesday_open: "", wednesday_close: "", wednesday_closed: false,
  thursday_open: "", thursday_close: "", thursday_closed: false,
  friday_open: "", friday_close: "", friday_closed: false,
  saturday_open: "", saturday_close: "", saturday_closed: false,
  sunday_open: "", sunday_close: "", sunday_closed: false,
  google_maps_url: "", instagram_url: "", facebook_url: "",
  avatar_url: "", banner_url: "", logo_url: "",
  price_notes: "", source_url: "", notes: "",
};

function merge(state, patch) { return { ...state, ...patch }; }

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanText(value) {
  return value.trim() || null;
}

function cleanCode(value) {
  return value.trim().toUpperCase() || null;
}

function validate(fields) {
  const e = {};
  if (!fields.business_name.trim()) e.business_name = "Required";
  if (!fields.business_type.trim()) e.business_type = "Required";
  return e;
}

function validatePublish(fields) {
  const e = validate(fields);
  const hasKnownCity = Boolean(fields.city_id);
  const hasManualCity = Boolean(fields.city_name.trim());

  if (!hasKnownCity && !hasManualCity) e.city_name = "Required to publish";
  if (!hasKnownCity && !fields.country_code.trim()) e.country_code = "Required to publish";
  return e;
}

function buildHours(fields) {
  if (fields.hours_mode === "24_7") {
    return { mode: "24_7", label: "Open 24/7" };
  }

  const hours = { mode: "custom" };
  let hasHours = false;

  for (const day of HOURS_DAYS) {
    if (fields[`${day}_closed`]) {
      hours[day] = "closed";
      hasHours = true;
      continue;
    }

    const open = cleanText(fields[`${day}_open`] ?? "");
    const close = cleanText(fields[`${day}_close`] ?? "");
    if (open || close) {
      hours[day] = { ...(open ? { open } : {}), ...(close ? { close } : {}) };
      hasHours = true;
    }
  }

  return hasHours ? hours : null;
}

function buildPayload(fields) {
  return {
    business_name:  fields.business_name.trim(),
    business_type:  fields.business_type.trim()   || null,
    service_id:     fields.service_id             || null,
    city_id:        fields.city_id                || null,
    city_name:      cleanText(fields.city_name),
    city_slug:      cleanText(fields.city_slug) || (fields.city_name.trim() ? toSlug(fields.city_name) : null),
    country_code:   cleanCode(fields.country_code),
    state_code:     cleanCode(fields.state_code),
    zip_code:       cleanText(fields.zip_code),
    description:    fields.description.trim()     || null,
    phone:          fields.phone.trim()           || null,
    email:          fields.email.trim()           || null,
    website_url:    fields.website_url.trim()     || null,
    address_text:   fields.address_text.trim()    || null,
    lat:            fields.lat  ? Number(fields.lat) : null,
    lng:            fields.lng  ? Number(fields.lng) : null,
    hours:          buildHours(fields),
    google_maps_url:  fields.google_maps_url.trim()  || null,
    instagram_url:    fields.instagram_url.trim()    || null,
    facebook_url:     fields.facebook_url.trim()     || null,
    avatar_url:       fields.avatar_url.trim()       || null,
    banner_url:       fields.banner_url.trim()       || null,
    logo_url:         fields.logo_url.trim()         || null,
    price_notes:      fields.price_notes.trim()      || null,
    source_url:       fields.source_url.trim()       || null,
    notes:            fields.notes.trim()            || null,
  };
}

export function useIntakeForm() {
  const navigate = useNavigate();
  const [fields,  setFields]  = useReducer(merge, INITIAL_FIELDS);
  const [errors,  setErrors]  = useReducer(merge, {});
  const [submit,  setSubmit]  = useReducer(merge, { status: "idle", error: null });

  const set = useCallback((key, value) => {
    setFields({ [key]: value });
    setErrors({ [key]: undefined });
  }, []);

  const setMany = useCallback((patch) => {
    setFields(patch);
    setErrors(Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])));
  }, []);

  const missingLatLng = fields.lat === "" || fields.lng === "";

  async function saveDraft() {
    const errs = validate(fields);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmit({ status: "submitting", error: null });
    try {
      await saveDraftIntakeLead(buildPayload(fields));
      setSubmit({ status: "idle", error: null });
      navigate("/dashboard/traze/intake");
    } catch (error) {
      setSubmit({ status: "error", error });
    }
  }

  async function approveAndCreate({ isIndexable = true } = {}) {
    const errs = isIndexable ? validatePublish(fields) : validate(fields);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmit({ status: "submitting", error: null });
    try {
      const lead     = await saveDraftIntakeLead(buildPayload(fields));
      const provider = await convertLeadToProvider(lead.id, { isIndexable });
      setSubmit({ status: "idle", error: null });
      navigate(`/dashboard/traze/providers/${provider.id}`);
    } catch (error) {
      setSubmit({ status: "error", error });
    }
  }

  return {
    fields,
    errors,
    submit,
    set,
    setMany,
    missingLatLng,
    saveDraft,
    approveAndCreate,
    createUnlisted: () => approveAndCreate({ isIndexable: true }),
  };
}

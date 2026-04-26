// Maps vport.services.key → default locksmith_service_details fields.
// Only used for initial INSERT (ignoreDuplicates=true) — never overwrites user edits.
export const LOCKSMITH_SERVICE_DEFAULTS = {
  residential_lockout: {
    service_family: 'residential',
    service_kind: 'house_lockout',
    is_mobile_service: true,
    is_emergency: true,
    requires_property_address: true,
    requires_photo_id: true,
    pricing_model: 'starting_at',
  },
  car_lockout: {
    service_family: 'automotive',
    service_kind: 'car_lockout',
    is_mobile_service: true,
    is_emergency: true,
    requires_vehicle_info: true,
    requires_proof_of_ownership: true,
    requires_photo_id: true,
    pricing_model: 'starting_at',
  },
  commercial_lockout: {
    service_family: 'commercial',
    service_kind: 'commercial_lockout',
    is_mobile_service: true,
    is_emergency: true,
    requires_property_address: true,
    requires_photo_id: true,
    pricing_model: 'starting_at',
  },
  rekey: {
    service_family: 'residential',
    service_kind: 'rekey',
    is_mobile_service: true,
    is_emergency: false,
    requires_property_address: true,
    pricing_model: 'quote',
  },
  lock_change: {
    service_family: 'residential',
    service_kind: 'lock_change',
    is_mobile_service: true,
    is_emergency: false,
    requires_property_address: true,
    pricing_model: 'quote',
  },
  lock_installation: {
    service_family: 'residential',
    service_kind: 'lock_install',
    is_mobile_service: true,
    is_emergency: false,
    requires_property_address: true,
    pricing_model: 'quote',
  },
  smart_lock_install: {
    service_family: 'security',
    service_kind: 'smart_lock_install',
    is_mobile_service: true,
    is_emergency: false,
    requires_property_address: true,
    pricing_model: 'quote',
  },
  key_duplication: {
    service_family: 'automotive',
    service_kind: 'key_duplication',
    is_mobile_service: false,
    is_emergency: false,
    pricing_model: 'fixed',
  },
  car_key_programming: {
    service_family: 'automotive',
    service_kind: 'car_key_programming',
    is_mobile_service: true,
    is_emergency: false,
    requires_vehicle_info: true,
    requires_proof_of_ownership: true,
    pricing_model: 'starting_at',
  },
  safe_opening: {
    service_family: 'safe',
    service_kind: 'safe_opening',
    is_mobile_service: true,
    is_emergency: false,
    requires_property_address: true,
    requires_proof_of_ownership: true,
    pricing_model: 'quote',
  },
  security_upgrade: {
    service_family: 'security',
    service_kind: 'security_upgrade',
    is_mobile_service: true,
    is_emergency: false,
    requires_property_address: true,
    pricing_model: 'quote',
  },
  _fallback: {
    service_family: 'residential',
    service_kind: 'other',
    is_mobile_service: true,
    is_emergency: false,
    pricing_model: 'quote',
  },
}

export function getLocksmithServiceDefaults(serviceKey) {
  const key = (serviceKey ?? '').toString().trim().toLowerCase()
  return LOCKSMITH_SERVICE_DEFAULTS[key] ?? LOCKSMITH_SERVICE_DEFAULTS['_fallback']
}

export const PROFESSION_CATALOG = Object.freeze([
  {
    key: 'nurse',
    label: 'Nurse',
    subtitle: 'Housing, hospital reviews, and city operations',
    sector: 'Healthcare',
    complianceScope: 'HIPAA and staffing policy',
    enabled: true,
  },
  {
    key: 'chef',
    label: 'Chef',
    subtitle: 'Kitchen operations, suppliers, and service quality',
    sector: 'Hospitality',
    complianceScope: 'Food safety and quality controls',
    enabled: true,
  },
  {
    key: 'driver',
    label: 'Driver',
    subtitle: 'Dispatch operations, route intelligence, and fleet health',
    sector: 'Mobility',
    complianceScope: 'Safety checks and route compliance',
    enabled: true,
  },
  {
    key: 'teacher',
    label: 'Teacher',
    subtitle: 'Academic operations and learning quality programs',
    sector: 'Education',
    complianceScope: 'Program standards and student safety',
    enabled: false,
  },
])

export const DEFAULT_PROFESSION_KEY = 'nurse'

export function getProfessionByKey(key) {
  return PROFESSION_CATALOG.find((item) => item.key === key) ?? null
}

export function getEnabledProfessionKeys() {
  return PROFESSION_CATALOG.filter((item) => item.enabled).map((item) => item.key)
}

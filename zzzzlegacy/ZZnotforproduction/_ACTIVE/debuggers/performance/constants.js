// debuggers/performance/constants.js
// Thresholds and configuration for the performance observability system.

export const THRESHOLDS = {
  QUERY_WARNING_MS: 300,
  QUERY_CRITICAL_MS: 1000,
  API_WARNING_MS: 300,
  API_CRITICAL_MS: 1000,
  PAYLOAD_WARNING_BYTES: 50_000,
  PAYLOAD_CRITICAL_BYTES: 200_000,
  ROW_COUNT_WARNING: 100,
  ROW_COUNT_CRITICAL: 500,
  DUPLICATE_WINDOW_MS: 5_000,
  NPLUS1_THRESHOLD: 3,
  OVERFETCH_COLUMN_THRESHOLD: 20,
  PAGE_LOAD_WARNING_MS: 2000,
  PAGE_LOAD_CRITICAL_MS: 5000,
  HYDRATION_WARNING_MS: 500,
}

export const MAX_EVENTS = 500
export const MAX_QUERIES = 1000
export const MAX_REQUESTS = 500

export const SEVERITY = {
  OK: 'ok',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

export const EVENT_TYPES = {
  DB_QUERY: 'db_query',
  API_REQUEST: 'api_request',
  PAGE_LOAD: 'page_load',
  HYDRATION: 'hydration',
  ROUTE_CHANGE: 'route_change',
  IMAGE_LOAD: 'image_load',
  RENDER: 'render',
}

export const SEVERITY_COLORS = {
  ok: '#4ade80',
  warning: '#fbbf24',
  critical: '#f87171',
}

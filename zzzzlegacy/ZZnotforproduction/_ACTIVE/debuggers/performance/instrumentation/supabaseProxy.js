// debuggers/performance/instrumentation/supabaseProxy.js
// Wraps Supabase client query methods to capture timing, row counts, and payload sizes.
// DEV-ONLY. In production this module exports a passthrough.

import { addDbQuery, isRecording, getDbQueries } from '../store.js'
import { getActiveContext } from './requestContext.js'

const TRACKED_METHODS = ['select', 'insert', 'update', 'upsert', 'delete']
const TRACKED_TERMINATORS = ['single', 'maybeSingle', 'csv', 'then']

let _proxyInstalled = false
let _originalFrom = null
let _originalSchema = null
let _originalRpc = null

function estimatePayloadSize(data) {
  if (!data) return 0
  try {
    return new Blob([JSON.stringify(data)]).size
  } catch (_) {
    return 0
  }
}

function extractColumns(selectStr) {
  if (!selectStr || selectStr === '*') return ['*']
  return selectStr
    .split(',')
    .map((c) => c.trim().split('(')[0].split(':').pop().trim())
    .filter(Boolean)
}

function detectDuplicates(entry, recentQueries) {
  const windowMs = 5000
  const now = Date.now()
  const entryTime = new Date(entry.timestamp).getTime()

  for (const prev of recentQueries) {
    const prevTime = new Date(prev.timestamp).getTime()
    if (now - prevTime > windowMs) break
    if (
      prev.table === entry.table &&
      prev.method === entry.method &&
      prev.queryName === entry.queryName &&
      prev.id !== entry.id
    ) {
      return prev.id
    }
  }
  return null
}

function wrapQueryBuilder(builder, meta) {
  if (!builder || typeof builder !== 'object') return builder

  const originalThen = builder.then?.bind(builder)
  const startTime = performance.now()

  if (originalThen) {
    builder.then = function wrappedThen(onFulfilled, onRejected) {
      return originalThen((result) => {
        const durationMs = performance.now() - startTime
        const ctx = getActiveContext()
        const data = result?.data
        const rowCount = Array.isArray(data) ? data.length : (data ? 1 : 0)
        const payloadSize = estimatePayloadSize(data)
        const columns = meta._selectStr ? extractColumns(meta._selectStr) : []

        const entry = addDbQuery({
          queryName: meta.queryName || meta.table,
          table: meta.table,
          schema: meta.schema,
          method: meta.method || 'select',
          durationMs,
          rowCount,
          columns,
          payloadSize,
          requestId: ctx?.id ?? null,
          route: ctx?.route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
          error: result?.error ?? null,
        })

        if (entry) {
          const recent = getDbQueries()
          const dup = detectDuplicates(entry, recent)
          if (dup) entry.duplicateOf = dup
        }

        if (onFulfilled) return onFulfilled(result)
        return result
      }, onRejected)
    }
  }

  // Track which select columns are being requested
  const originalSelect = builder.select?.bind(builder)
  if (originalSelect) {
    builder.select = function wrappedSelect(columns, ...rest) {
      meta._selectStr = columns
      meta.method = 'select'
      const result = originalSelect(columns, ...rest)
      return wrapQueryBuilder(result, meta)
    }
  }

  // Wrap chained filter/modifier methods to keep tracking through the chain
  const chainMethods = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'contains', 'containedBy', 'range', 'overlaps',
    'match', 'not', 'or', 'filter',
    'order', 'limit', 'offset', 'single', 'maybeSingle',
    'insert', 'update', 'upsert', 'delete',
  ]

  for (const methodName of chainMethods) {
    const original = builder[methodName]?.bind(builder)
    if (original) {
      builder[methodName] = function (...args) {
        if (TRACKED_METHODS.includes(methodName)) {
          meta.method = methodName
        }
        const result = original(...args)
        if (result && typeof result === 'object' && typeof result.then === 'function') {
          return wrapQueryBuilder(result, meta)
        }
        return result
      }
    }
  }

  return builder
}

export function installSupabaseProxy(supabaseClient) {
  if (!import.meta.env.DEV) return supabaseClient
  if (_proxyInstalled) return supabaseClient

  _proxyInstalled = true
  _originalFrom = supabaseClient.from.bind(supabaseClient)
  _originalRpc = supabaseClient.rpc.bind(supabaseClient)

  // Wrap .from()
  supabaseClient.from = function proxiedFrom(table) {
    if (!isRecording()) return _originalFrom(table)

    const builder = _originalFrom(table)
    const meta = {
      table,
      schema: 'public',
      method: 'select',
      queryName: table,
      _selectStr: null,
    }
    return wrapQueryBuilder(builder, meta)
  }

  // Wrap .schema().from()
  const originalSchema = supabaseClient.schema?.bind(supabaseClient)
  if (originalSchema) {
    _originalSchema = originalSchema
    supabaseClient.schema = function proxiedSchema(schemaName) {
      const schemaBuilder = _originalSchema(schemaName)
      const originalSchemaFrom = schemaBuilder.from.bind(schemaBuilder)

      schemaBuilder.from = function proxiedSchemaFrom(table) {
        if (!isRecording()) return originalSchemaFrom(table)

        const builder = originalSchemaFrom(table)
        const meta = {
          table,
          schema: schemaName,
          method: 'select',
          queryName: `${schemaName}.${table}`,
          _selectStr: null,
        }
        return wrapQueryBuilder(builder, meta)
      }

      return schemaBuilder
    }
  }

  // Wrap .rpc()
  supabaseClient.rpc = function proxiedRpc(fnName, params, options) {
    if (!isRecording()) return _originalRpc(fnName, params, options)

    const startTime = performance.now()
    const result = _originalRpc(fnName, params, options)

    const originalThen = result.then?.bind(result)
    if (originalThen) {
      result.then = function wrappedRpcThen(onFulfilled, onRejected) {
        return originalThen((res) => {
          const durationMs = performance.now() - startTime
          const ctx = getActiveContext()
          const data = res?.data
          const rowCount = Array.isArray(data) ? data.length : (data ? 1 : 0)

          addDbQuery({
            queryName: `rpc:${fnName}`,
            table: fnName,
            schema: 'rpc',
            method: 'rpc',
            durationMs,
            rowCount,
            columns: [],
            payloadSize: estimatePayloadSize(data),
            requestId: ctx?.id ?? null,
            route: ctx?.route ?? window.location.pathname,
            error: res?.error ?? null,
          })

          if (onFulfilled) return onFulfilled(res)
          return res
        }, onRejected)
      }
    }

    return result
  }

  return supabaseClient
}

export function uninstallSupabaseProxy(supabaseClient) {
  if (!_proxyInstalled) return
  if (_originalFrom) supabaseClient.from = _originalFrom
  if (_originalSchema) supabaseClient.schema = _originalSchema
  if (_originalRpc) supabaseClient.rpc = _originalRpc
  _proxyInstalled = false
}

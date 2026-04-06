// src/utils/transaction.js
// ============================================================
// Chat Engine — Transaction Wrapper
// ------------------------------------------------------------
// Supabase does not expose client-side transaction primitives.
// True atomicity must go through an RPC (Postgres function).
//
// This module provides:
//   - runInTransaction()  → wraps multi-step operations and
//     rolls back by catching + re-throwing so the caller can
//     decide on compensating actions
//   - runAtomic()         → executes a single named RPC that
//     is expected to run as a DB-level transaction
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Execute a sequence of async steps as a logical unit.
 *
 * Each step receives the Supabase client. If any step throws,
 * the error propagates immediately — no partial commits are
 * silently swallowed.
 *
 * Note: this does NOT provide DB-level rollback. Use runAtomic()
 * with an RPC for true atomicity.
 *
 * @param {Function[]} steps  - Array of (supabase) => Promise<any>
 * @returns {Promise<any[]>}  - Results of each step in order
 */
export async function runInTransaction(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('[runInTransaction] steps must be a non-empty array')
  }

  const supabase = getSupabaseClient()
  const results = []

  for (const step of steps) {
    const result = await step(supabase)
    results.push(result)
  }

  return results
}

/**
 * Execute a named Postgres RPC function as a single DB transaction.
 *
 * Use this for any operation that must be atomic at the DB level
 * (e.g., insert message + bump inbox + emit outbox event in one tx).
 *
 * @param {string} rpcName   - Name of the Postgres function
 * @param {Object} params    - Parameters passed to the function
 * @returns {Promise<any>}   - Raw return value from the RPC
 */
export async function runAtomic(rpcName, params = {}) {
  if (!rpcName) {
    throw new Error('[runAtomic] rpcName is required')
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .rpc(rpcName, params)

  if (error) throw error

  return data
}

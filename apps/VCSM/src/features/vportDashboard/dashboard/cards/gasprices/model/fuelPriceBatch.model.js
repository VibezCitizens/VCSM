/**
 * Model — Pure translator / grouper
 *
 * Groups flat fuel-price submission rows (already mapped to domain shape by
 * mapFuelPriceSubmissionRows) into one entry per citizen submission batch.
 *
 * Group key: submissionBatchId. A batch is, by construction, one citizen
 * (submittedByActorId) submitting one or more fuels in a single action for one
 * station (profileId is internal — never surfaced past this layer). We still
 * carry submittedByActorId so the dashboard can render the citizen identity.
 *
 * No I/O. No business rules. No permissions.
 */

function epochMs(value) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * @param {Array} submissions — mapped submission objects (domain shape)
 * @returns {Array} batches — newest batch first; fuel rows newest-fuel-first
 */
export function groupSubmissionsIntoBatches(submissions = []) {
  if (!Array.isArray(submissions) || submissions.length === 0) return [];

  const byBatch = new Map();

  for (const s of submissions) {
    if (!s) continue;
    // Fall back to submission id so a row without a batch id still renders as a
    // standalone single-fuel batch rather than being dropped.
    const key = s.submissionBatchId ?? s.id ?? null;
    if (!key) continue;

    if (!byBatch.has(key)) {
      byBatch.set(key, {
        submissionBatchId: s.submissionBatchId ?? s.id,
        submittedByActorId: s.submittedByActorId ?? null,
        submittedAtMin: s.submittedAt ?? null,
        submittedAtMax: s.submittedAt ?? null,
        submissions: [],
      });
    }

    const batch = byBatch.get(key);
    batch.submissions.push(s);

    if (epochMs(s.submittedAt) < epochMs(batch.submittedAtMin) || !batch.submittedAtMin) {
      batch.submittedAtMin = s.submittedAt;
    }
    if (epochMs(s.submittedAt) > epochMs(batch.submittedAtMax) || !batch.submittedAtMax) {
      batch.submittedAtMax = s.submittedAt;
    }
  }

  const batches = [...byBatch.values()];

  for (const b of batches) {
    b.submissions.sort((a, c) => epochMs(c.submittedAt) - epochMs(a.submittedAt));
  }

  // Newest batch first (by its latest submission time).
  batches.sort((a, b) => epochMs(b.submittedAtMax) - epochMs(a.submittedAtMax));

  return batches;
}

/**
 * Attach a resolved submitter identity ({ displayName, avatar }) to each batch.
 * summariesByActorId is a plain map of actorId -> { displayName, avatar }.
 * Degrades gracefully: a missing entry leaves submitter null.
 */
export function attachSubmittersToBatches(batches = [], summariesByActorId = {}) {
  if (!Array.isArray(batches)) return [];
  return batches.map((b) => ({
    ...b,
    submitter: b.submittedByActorId ? summariesByActorId[b.submittedByActorId] ?? null : null,
  }));
}

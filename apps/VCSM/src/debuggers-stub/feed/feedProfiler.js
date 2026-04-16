// Production stub
export function startFeedSession() {}
export function endFeedSession() {}
export function recordStep() {}
export function wrapDAL(fn) { return fn }
export function getActiveFeedSession() { return null }
export function getFeedSessions() { return [] }
export function getLatestFeedSession() { return null }
export function clearFeedSessions() {}
export function subscribeFeedProfiler() { return () => {} }
export function formatFeedReport() { return '' }

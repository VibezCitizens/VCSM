// Production stub — all debugger functions are no-ops in production builds
export function FeedDebugPanel() { return null }
export function FeedProfilerOverlay() { return null }
export function debugFeedEvent() {}
export function debugFeedViewer() {}
export function debugFeedResult() {}
export function getFeedDebugState() { return { events: [] } }
export function clearFeedDebugState() {}
export function subscribeFeedDebug() { return () => {} }

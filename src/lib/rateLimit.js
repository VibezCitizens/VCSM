// Simple localStorage-based cooldown with explicit namespaces.
// Examples of namespaces you can use:
//   - `post:${userId}`           -> personal posts
//   - `vport-photo:${vportId}`   -> avatar/banner edits for a VPort

const NS = 'vcsm:rl:';

function nowMs() { return Date.now(); }

export function getCooldown(namespace) {
  const key = NS + namespace;
  const ts = parseInt(localStorage.getItem(key) || '0', 10);
  return isNaN(ts) ? 0 : ts;
}

export function setCooldown(namespace, msFromNow) {
  const key = NS + namespace;
  localStorage.setItem(key, String(nowMs() + msFromNow));
}

export function clearCooldown(namespace) {
  localStorage.removeItem(NS + namespace);
}

/**
 * Require a cooldown to be expired before allowing an action.
 * @param {string} namespace - e.g. `post:USERID` or `vport-photo:VPORTID`
 * @param {number} cooldownSec - seconds to wait between actions
 * @returns {{ok: boolean, waitMs: number, waitText: string}}
 */
export function requireCooldown(namespace, cooldownSec) {
  const until = getCooldown(namespace);
  if (until <= nowMs()) {
    // not in cooldown; set next window
    setCooldown(namespace, cooldownSec * 1000);
    return { ok: true, waitMs: 0, waitText: '' };
  }
  const waitMs = until - nowMs();
  const mins = Math.ceil(waitMs / 60000);
  return {
    ok: false,
    waitMs,
    waitText: mins >= 60
      ? `${Math.ceil(mins / 60)} hour(s)`
      : `${mins} minute(s)`,
  };
}

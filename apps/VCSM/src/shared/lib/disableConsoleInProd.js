const METHODS_TO_MUTE = [
  'log',
  'debug',
  'info',
  'warn',
  'error',
  'trace',
  'table',
  'group',
  'groupCollapsed',
  'groupEnd',
  'time',
  'timeEnd',
]

function muteConsoleMethod(target, method) {
  try {
    target[method] = () => {}
    return
  } catch {
    // Fall through to defineProperty path.
  }

  try {
    Object.defineProperty(target, method, {
      value: () => {},
      writable: false,
      configurable: true,
    })
  } catch {
    // If the runtime blocks overriding console methods, ignore safely.
  }
}

export function disableConsoleInProd() {
  if (!import.meta.env.PROD) return

  const target = globalThis?.console
  if (!target) return
  if (target.__VCSM_MUTED__ === true) return

  METHODS_TO_MUTE.forEach((method) => {
    if (typeof target[method] === 'function') {
      muteConsoleMethod(target, method)
    }
  })

  try {
    Object.defineProperty(target, '__VCSM_MUTED__', {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    })
  } catch {
    // Non-critical marker only.
  }
}

disableConsoleInProd()

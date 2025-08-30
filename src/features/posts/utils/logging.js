const dev = import.meta?.env?.MODE !== 'production';

export const gstart = (label, extra = {}) => {
  if (dev) console.groupCollapsed(`%c[PostCard] ${label}`, 'color:#a78bfa;font-weight:bold', extra);
};
export const gend  = () => { if (dev) console.groupEnd(); };
export const log   = (...a) => { if (dev) console.log('%c[PostCard]', 'color:#a78bfa', ...a); };
export const warn  = (...a) => { if (dev) console.warn('%c[PostCard]', 'color:#f59e0b', ...a); };
export const err   = (...a) => { if (dev) console.error('%c[PostCard]', 'color:#ef4444', ...a); };

export const logSupa = (label, { data, error, count }) => {
  if (!dev) return;
  if (error) err(`${label} -> ERROR`, error);
  else log(`${label} -> OK`, { rows: Array.isArray(data) ? data.length : data ? 1 : 0, count, data });
};

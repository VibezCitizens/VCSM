// debuggers/shared/DebugRail.jsx
// DEV-ONLY. Two fixed flex-column rails (left/right) for stacking debug panels.
// All panels portal into #debug-rail-right or #debug-rail-left.

export default function DebugRailPortals() {
  if (!import.meta.env.DEV) return null

  const base = {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: '90vh',
    overflowY: 'auto',
    overflowX: 'visible',
  }

  return (
    <>
      <div id="debug-rail-right" style={{ ...base, right: 8, alignItems: 'flex-end' }} />
      <div id="debug-rail-left"  style={{ ...base, left: 8,  alignItems: 'flex-start' }} />
    </>
  )
}

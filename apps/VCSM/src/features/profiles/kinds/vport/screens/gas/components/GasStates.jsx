// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\GasStates.jsx

export function GasStates({
  loading = false,
  error = null,
  empty = false,
  emptyText = "No gas prices yet.",
}) {
  if (loading) {
    return (
      <div className="profiles-subcard p-4 text-sm profiles-muted">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="profiles-error rounded-2xl p-4 text-sm">
        {String(error?.message ?? error)}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="profiles-subcard p-4 text-sm profiles-muted">
        {emptyText}
      </div>
    );
  }

  return null;
}

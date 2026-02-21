// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\GasStates.jsx

export function GasStates({
  loading = false,
  error = null,
  empty = false,
  emptyText = "No gas prices yet.",
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
        {String(error?.message ?? error)}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-400">
        {emptyText}
      </div>
    );
  }

  return null;
}
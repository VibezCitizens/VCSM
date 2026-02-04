// src/season/lovedrop/components/LovedropLoading.jsx

export function LovedropLoading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm opacity-70">
      {label}
    </div>
  )
}

export default LovedropLoading

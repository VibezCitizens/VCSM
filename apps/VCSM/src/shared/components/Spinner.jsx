export default function Spinner({ size = 30, label = '', className = '' }) {
  const numericSize = Number(size) > 0 ? Number(size) : 30

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <span className="relative inline-block" style={{ width: numericSize, height: numericSize }} aria-hidden>
        <span className="absolute inset-0 rounded-full border-2 border-violet-200/15" />
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-300 border-r-fuchsia-300 animate-spin"
          style={{ animationDuration: '700ms' }}
        />
        <span className="absolute inset-[34%] rounded-full bg-violet-300/80 animate-pulse" />
      </span>

      {label ? <span className="text-sm text-slate-300">{label}</span> : null}
    </div>
  )
}

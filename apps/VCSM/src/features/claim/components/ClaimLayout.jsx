// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — claim funnel page shell.
// Mirrors the onboarding/auth visual language (dark gradient + centered card).

export default function ClaimLayout({ children }) {
  return (
    <div
      className="min-h-screen px-4 py-8 text-white"
      style={{
        background:
          'radial-gradient(900px 500px at 15% 10%, rgba(108,77,246,0.15), transparent 60%), radial-gradient(800px 420px at 85% 90%, rgba(59,130,246,0.10), transparent 60%), #0b0b0f',
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[460px] items-center justify-center">
        <div
          className="w-full rounded-2xl border border-white/10 p-6 sm:p-7"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,20,26,0.98) 0%, rgba(20,20,26,0.90) 100%)',
            boxShadow:
              '0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

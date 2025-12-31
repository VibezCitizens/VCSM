import { useState } from 'react'

const STEPS = [
  {
    img: '/instaliOs/step1.jpg',
    title: 'Open Share Menu',
    text: 'Tap the Share button in Safari.',
  },
  {
    img: '/instaliOs/step2.jpg',
    title: 'Add to Home Screen',
    text: 'Scroll and tap “Add to Home Screen”.',
  },
  {
    img: '/instaliOs/step3.jpg',
    title: 'Install App',
    text: 'Tap “Add” to install Vibez Citizens.',
  },
]


export default function IosInstallSteps({ onDone }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1

  return (
    <div className="flex flex-col items-center text-center">
      {/* IMAGE */}
      <img
        src={STEPS[step].img}
        alt={STEPS[step].title}
        className="
          w-full max-w-[260px]
          rounded-xl
          border border-black/10
        "
      />

      {/* TEXT */}
      <h3 className="mt-4 text-base font-semibold">
        {STEPS[step].title}
      </h3>

      <p className="mt-1 text-sm text-neutral-600">
        {STEPS[step].text}
      </p>

      {/* DOTS */}
      <div className="mt-3 flex gap-2">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`
              h-2 w-2 rounded-full
              ${i === step ? 'bg-black' : 'bg-black/20'}
            `}
          />
        ))}
      </div>

      {/* CONTROLS */}
      <div className="mt-5 flex w-full justify-between gap-3">
        <button
          disabled={step === 0}
          onClick={() => setStep(s => Math.max(0, s - 1))}
          className="flex-1 h-9 rounded-lg border text-sm disabled:opacity-40"
        >
          Back
        </button>

        {last ? (
          <button
            onClick={onDone}
            className="flex-1 h-9 rounded-lg bg-black text-white text-sm"
          >
            Got it
          </button>
        ) : (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex-1 h-9 rounded-lg bg-black text-white text-sm"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

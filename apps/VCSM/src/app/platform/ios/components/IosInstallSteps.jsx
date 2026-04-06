import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  House,
  Share2,
  SquarePlus,
} from 'lucide-react'

const STEPS = [
  {
    img: '/instaliOs/step1-v2.jpg',
    title: 'Open Share Menu',
    text: 'Tap the Share button in Safari.',
    Icon: Share2,
  },
  {
    img: '/instaliOs/step2-v2.jpg',
    title: 'Add to Home Screen',
    text: 'Scroll and tap Add to Home Screen.',
    Icon: SquarePlus,
  },
  {
    img: '/instaliOs/step3-v2.jpg',
    title: 'Install App',
    text: 'Tap Add to install Vibez Citizens.',
    Icon: House,
    hint: 'Look at the top-right corner and tap Add.',
  },
]

export default function IosInstallSteps({ onDone }) {
  const MotionImg = motion.img
  const MotionDiv = motion.div

  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const last = step === STEPS.length - 1
  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step])
  const StepIcon = current.Icon

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-[248px] rounded-[28px] border border-white/15 bg-slate-950/70 p-2 shadow-[0_16px_36px_rgba(2,6,23,0.45)] sm:max-w-[292px]">
        <AnimatePresence mode="wait">
          <MotionImg
            key={current.img}
            src={current.img}
            alt={current.title}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="mx-auto max-h-[42dvh] w-full rounded-[22px] border border-white/10 object-contain"
          />
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/35 bg-cyan-300/12 text-cyan-100">
          <StepIcon size={16} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">
            {current.title}
          </h3>
          <p className="text-sm text-slate-300/80">
            {current.text}
          </p>
        </div>
      </div>
      {current.hint ? (
        <div className="mt-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
          {current.hint}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-slate-400/90">
          <span>Step {step + 1}</span>
          <span>{STEPS.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <MotionDiv
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-indigo-300"
          />
        </div>

        <div className="mt-3 flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={[
                'h-2.5 flex-1 rounded-full transition',
                i === step ? 'bg-cyan-200' : 'bg-white/20 hover:bg-white/35',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex w-full justify-between gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="
            flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl
            border border-white/20 bg-white/6 text-sm text-white
            transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {last ? (
          <button
            type="button"
            onClick={onDone}
            className="
              flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl
              bg-gradient-to-r from-cyan-400 to-indigo-400
              text-sm font-semibold text-slate-950
              transition hover:brightness-110
            "
          >
            <Check size={15} />
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="
              flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl
              bg-gradient-to-r from-cyan-400 to-indigo-400
              text-sm font-semibold text-slate-950
              transition hover:brightness-110
            "
          >
            Next
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

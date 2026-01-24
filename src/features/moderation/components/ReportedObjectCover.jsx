import { motion, AnimatePresence } from "framer-motion";

export default function ReportedObjectCover({
  open = false,
  title = "Thanks for your report",
  subtitle = "We received your report. This content is now hidden for you while we review it.",
  primaryLabel = "Back To Central Citizen",
  onPrimary,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999999] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="h-full w-full flex items-center justify-center px-5">
            <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="text-lg font-semibold text-white">
                {title}
              </div>

              <div className="text-sm text-neutral-400 mt-2">
                {subtitle}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={onPrimary}
                  className="w-full rounded-xl bg-white text-black py-2.5 font-semibold"
                >
                  {primaryLabel}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";

export default function ReportCoverScreen({
  open = false,
  title = "Report",
  subtitle = null,
  loading = false,
  onClose,
  children,
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
          {/* top bar */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-900">
            <button
              onClick={onClose}
              className="text-neutral-300 hover:text-white transition"
              type="button"
              disabled={loading}
            >
              Cancel
            </button>

            <div className="text-sm text-neutral-200 font-semibold">{title}</div>

            <div className="w-[64px]" />
          </div>

          <div className="max-w-xl mx-auto px-4 py-5">
            {subtitle ? (
              <div className="text-sm text-neutral-400 mb-4">{subtitle}</div>
            ) : null}

            {/* content */}
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 overflow-hidden">
              <div className="p-4">{children}</div>
            </div>

            {loading ? (
              <div className="mt-4 text-sm text-neutral-400">Submitting…</div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

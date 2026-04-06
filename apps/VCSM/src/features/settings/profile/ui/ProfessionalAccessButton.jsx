import { useNavigate } from 'react-router-dom'
import { releaseFlags } from '@/shared/config/releaseFlags'

/**
 * Settings entry point for the nurse notes workspace.
 */

export default function ProfessionalAccessButton({ onClick }) {
  const navigate = useNavigate()

  if (!releaseFlags.professionalWorkspace) {
    return null
  }

  return (
    <button
      type="button"
      onClick={onClick ?? (() => navigate('/professional-access'))}
      className="
        settings-card-surface
        settings-btn
        w-full
        mt-4
        px-4
        py-3
        rounded-xl
        hover:bg-slate-800/80
        active:bg-slate-800/95
        text-left
        transition
      "
    >
      <div className="flex flex-col">
        <span className="text-[16px] font-semibold text-slate-100">
          Nurse Notes Workspace
        </span>
        <span className="mt-0.5 text-[13px] text-slate-400">
          Share housing and hospital notes with verified nurses
        </span>
      </div>
    </button>
  )
}

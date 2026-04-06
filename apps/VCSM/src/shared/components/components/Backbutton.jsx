// src/ui/components/Backbutton.jsx
import { useNavigate } from 'react-router-dom';

export default function Backbutton({
  onBack = null,
  label = 'Back',
  className = '',
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack && typeof onBack === 'function') {
      return onBack();
    }
    navigate(-1);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`flex items-center gap-2 text-sm text-neutral-300 hover:text-white transition ${className}`}
    >
      {/* Back Arrow Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 19.5L8.25 12l7.5-7.5"
        />
      </svg>

      <span>{label}</span>
    </button>
  );
}

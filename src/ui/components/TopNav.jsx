// src/ui/components/TopNav.jsx
import { useNavigate, useLocation } from 'react-router-dom';

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const inVoid = pathname.startsWith('/void');

  return (
    <div className="fixed top-0 inset-x-0 z-50 h-12 bg-black border-b border-neutral-800">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="w-8" />
        <h1 className="text-lg font-bold text-center flex-1">
          {inVoid ? 'The Void' : 'Vibez Citizens'}
        </h1>
        <div className="w-8 flex justify-end">
          {inVoid ? (
            <button
              onClick={() => navigate('/feed')}
              title="Exit the Void"
              className="text-white opacity-80 hover:opacity-100 transition focus:outline-none"
            >
              🚪
            </button>
          ) : (
            <button
              onClick={() => navigate('/void')}
              title="Enter the Void"
              className="text-white opacity-60 hover:opacity-100 transition focus:outline-none"
            >
              👁️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

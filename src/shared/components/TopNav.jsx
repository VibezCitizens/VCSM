import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, LogOut } from 'lucide-react';

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const inVoid = pathname.startsWith('/void');
  const isChatInboxRoot = pathname === '/chat';

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 bg-black pt-[env(safe-area-inset-top)] ${
        isChatInboxRoot ? 'border-b-0' : 'border-b border-neutral-800'
      }`}
    >
      <div className="h-12 px-4 flex items-center justify-between gap-2">
        <div className="min-w-[84px]" aria-hidden="true" />

        <h1 className="text-xl font-bold text-center flex-1 select-none">
          {inVoid ? 'The Void' : 'Vibez Citizens'}
        </h1>

        <div className="min-w-[84px] flex justify-end">
          {inVoid ? (
            <button
              onClick={() => navigate('/feed')}
              title="Exit the Void"
              className="text-white opacity-80 hover:opacity-100 transition focus:outline-none"
              aria-label="Exit the Void"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button
              onClick={() => navigate('/void')}
              title="Enter the Void"
              className="text-white opacity-60 hover:opacity-100 transition focus:outline-none"
              aria-label="Enter the Void"
            >
              <Eye size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

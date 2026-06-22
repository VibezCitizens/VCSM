import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, LogOut } from 'lucide-react';
import { useTranslation } from '@i18n';

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const inVoid = pathname.startsWith('/void');
  const isChatInboxRoot = pathname === '/chat';

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 bg-[var(--vc-bg-0)]/72 backdrop-blur-md pt-[env(safe-area-inset-top)] ${
        isChatInboxRoot ? 'border-b-0' : 'border-b border-white/10'
      }`}
    >
      <div className="h-12 px-4 flex items-center justify-between gap-2">
        <div className="min-w-[84px]" aria-hidden="true" />

        <h1 className="text-xl font-bold text-center flex-1 select-none">
          {inVoid ? t('nav.theVoid') : t('nav.vibezCitizens')}
        </h1>

        <div className="min-w-[84px] flex justify-end">
          {inVoid ? (
            <button
              onClick={() => navigate('/CentralFeed')}
              title={t('nav.exitVoid')}
              className="text-white opacity-80 hover:opacity-100 transition focus:outline-none"
              aria-label={t('nav.exitVoid')}
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button
              onClick={() => navigate('/void')}
              title={t('nav.enterVoid')}
              className="text-white opacity-60 hover:opacity-100 transition focus:outline-none"
              aria-label={t('nav.enterVoid')}
            >
              <Eye size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

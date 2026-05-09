import { SearchX } from 'lucide-react';
import { useTranslation } from '@i18n'

export default function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="explore-empty-state flex flex-col items-center justify-center text-zinc-500">

      <SearchX size={48} className="mb-3 opacity-40" />

      <p className="text-sm">{t('explore.noResults')}</p>

      <p className="text-xs mt-1 opacity-70">
        {t('explore.noResultsHint')}
      </p>

    </div>
  );
}

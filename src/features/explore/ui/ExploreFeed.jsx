import CitizensRow from '@/features/explore/ui/CitizensRow';
import VportsRow from '@/features/explore/ui/VportsRow';

export default function ExploreFeed({ filter = 'all' }) {
  const showCitizens = filter === 'all' || filter === 'users'
  const showVports = filter === 'all' || filter === 'vports'

  return (
    <div className="space-y-4 px-2 pt-2 pb-24">
      {showCitizens && <CitizensRow />}
      {showVports && <VportsRow />}
    </div>
  );
}

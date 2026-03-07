import CitizensRow from '@/features/explore/ui/CitizensRow';
import VportsRow from '@/features/explore/ui/VportsRow';

const SHOW_EXPLORE_DISCOVERY_BLOCKS = false

export default function ExploreFeed({ filter = 'all' }) {
  if (!SHOW_EXPLORE_DISCOVERY_BLOCKS) return null

  const showCitizens = filter === 'all' || filter === 'users'
  const showVports = filter === 'all' || filter === 'vports'

  return (
    <div className="space-y-4 px-2 pt-2 pb-24 explore-modern">
      {showCitizens && <CitizensRow />}
      {showVports && <VportsRow />}
    </div>
  );
}

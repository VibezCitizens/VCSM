import CitizensRow from '@/features/explore/ui/CitizensRow';
import VportsRow from '@/features/explore/ui/VportsRow';

export default function ExploreFeed() {
  return (
    <div className="space-y-4 px-2 pt-2 pb-24">

      <CitizensRow />

      <VportsRow />

    </div>
  );
}

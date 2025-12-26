import CitizensRow from '@/features/explore/ui/CitizensRow';
import VideoRow from '@/features/explore/ui/VideoRow';
import VportsRow from '@/features/explore/ui/VportsRow';

export default function ExploreFeed() {
  return (
    <div className="space-y-5 px-3 pt-2 pb-24">

      <CitizensRow />

      <VideoRow />

      <VportsRow />

    </div>
  );
}

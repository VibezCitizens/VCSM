import UserLink from './UserLink';

export default function ProfileCard({ user }) {
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4">
      <UserLink
        user={user}
        avatarSize="w-16 h-16"
        avatarShape="rounded-2xl"
        textSize="text-lg"
        showUsername={true}
      />

      {/* STATS */}
      <div className="mt-4 flex gap-6 text-white">
        <div>
          <div className="text-xl font-bold">{user.top10Friends?.length || 0}</div>
          <div className="text-xs text-neutral-400">Top Friends</div>
        </div>
        <div>
          <div className="text-xl font-bold">{user.followersCount}</div>
          <div className="text-xs text-neutral-400">Followers</div>
        </div>
        <div>
          <div className="text-xl font-bold">{user.followingCount}</div>
          <div className="text-xs text-neutral-400">Following</div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-4">
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white w-full">
          Message
        </button>
      </div>
    </div>
  );
}

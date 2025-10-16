// C:\Users\vibez\OneDrive\Desktop\no src\src\features\notifications\notificationcenter\friendrequest\NotiFollowRequestAcceptedItem.jsx

/**
 * NotiFollowRequestAcceptedItem
 *
 * Shows when *your* follow request was accepted by the target.
 *
 * Props:
 *  - notification: {
 *      id, created_at,
 *      context: {
 *        target: { id, username, display_name, photo_url }
 *      }
 *    }
 */
export default function NotiFollowRequestAcceptedItem({ notification }) {
  const n = notification || {};
  const { created_at, context } = n;
  const targetProfile = context?.target || null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
      <img
        src={targetProfile?.photo_url || '/avatar.jpg'}
        alt=""
        className="w-9 h-9 rounded-lg object-cover"
      />
      <div className="flex flex-col min-w-0">
        <div className="text-sm truncate">
          <span className="font-medium">
            {targetProfile?.display_name || targetProfile?.username || 'User'}
          </span>{' '}
          accepted your follow request
        </div>
        <div className="text-xs text-neutral-400">
          {created_at ? new Date(created_at).toLocaleString() : ''}
        </div>
      </div>
    </div>
  );
}

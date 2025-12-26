export default function FriendListSection({ title, ids, renderItem }) {
  if (!ids?.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs uppercase tracking-wide text-neutral-400">
        {title}
      </h4>
      <div className="space-y-2">
        {ids.map(renderItem)}
      </div>
    </div>
  );
}

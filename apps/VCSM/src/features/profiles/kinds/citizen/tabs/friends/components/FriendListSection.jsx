export default function FriendListSection({ title, ids, renderItem }) {
  if (!ids?.length) return null;

  return (
    <section className="profiles-friends-section space-y-2">
      <h4 className="profiles-friends-section-title text-xs uppercase tracking-wide">
        {title}
      </h4>
      <div className="space-y-2.5">
        {ids.map(renderItem)}
      </div>
    </section>
  );
}

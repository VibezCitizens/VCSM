import NotificationItem from './NotificationItem.view';

export default function NotificationsView({ rows, loading }) {
  if (loading) {
    return <div className="py-10 text-neutral-400">Loading…</div>;
  }

  if (!rows.length) {
    return <div className="py-10 text-neutral-500">No notifications</div>;
  }

  return (
    <ul className="space-y-1 list-none p-0 m-0">
      {rows.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </ul>
  );
}

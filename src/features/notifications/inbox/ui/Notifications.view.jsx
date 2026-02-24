import NotificationItem from './NotificationItem.view'

export default function NotificationsView({ rows, loading }) {
  if (loading) {
    return <div className="py-10 text-center text-slate-400">Loading...</div>
  }

  if (!rows.length) {
    return <div className="py-10 text-center text-slate-500">No notifications</div>
  }

  return (
    <ul className="m-0 list-none space-y-2 p-3">
      {rows.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </ul>
  )
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { db } from '@/data/data';
import CreateVportInline from '../components/CreateVportInline';

export default function VportsTab() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      // owner-only list
      const list = await db.profiles.vports.listOwnedByMe();
      setItems(list ?? []);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <div className="font-semibold mb-2">Your VPORTs</div>
        {!items.length ? (
          <div className="text-sm text-zinc-400">You don’t own any yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map(v => (
              <li key={v.id} className="flex items-center justify-between bg-zinc-900 rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <img src={v.avatar_url || '/avatar.jpg'} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  <div className="text-sm">{v.name}</div>
                </div>
                <Link to={`/vport/${v.id}`} className="text-purple-400 hover:underline text-sm">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="font-semibold mb-2">Create a VPORT</div>
        <CreateVportInline onCreated={(v) => setItems((s) => [v, ...s])} />
      </Card>
    </div>
  );
}

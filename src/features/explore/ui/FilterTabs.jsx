export default function FilterTabs({ active, onChange }) {
  const tabs = [
    'All',
    'Vibez Citizens',
    'Users',
    'Vports',
    'Posts',
    'Videos',
    'Groups'
  ];

  return (
    <div className="flex gap-2 overflow-x-auto px-3 py-2 border-b border-zinc-800 no-scrollbar">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3 py-1.5 rounded-full text-xs transition whitespace-nowrap ${
            active === tab
              ? 'bg-white text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

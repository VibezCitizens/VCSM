// src/ui/components/Tabs.jsx
export function Tabs({ value, onChange, children, className = '' }) {
  return <div className={`flex justify-around text-xs font-semibold ${className}`}>{children}</div>;
}
export function Tab({ value, current, onChange, children }) {
  const active = current === value;
  return (
    <button
      onClick={() => onChange(value)}
      className={`flex-1 py-3 ${active ? 'text-white border-b-2 border-purple-500' : 'text-gray-500'}`}
    >
      {children}
    </button>
  );
}

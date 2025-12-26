import { SearchX } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
      
      <SearchX size={48} className="mb-3 opacity-40" />

      <p className="text-sm">No results found</p>

      <p className="text-xs mt-1 opacity-70">
        Try searching something else
      </p>

    </div>
  );
}

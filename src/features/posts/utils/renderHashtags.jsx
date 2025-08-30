import { Link } from 'react-router-dom';

export function renderTextWithHashtags(text = '') {
  return text.split(/(\s+)/).map((part, i) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
      return (
        <Link key={`${part}-${i}`} to={`/tag/${tag}`} className="text-purple-400 hover:underline">
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

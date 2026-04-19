import Link from "next/link";

export function DirectoryBreadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const showSeparator = !isLast;

        return (
          <span key={`${item.label}:${index}`}>
            {item.href && !isLast ? <Link href={item.href}>{item.label}</Link> : item.label}
            {showSeparator ? " / " : ""}
          </span>
        );
      })}
    </nav>
  );
}

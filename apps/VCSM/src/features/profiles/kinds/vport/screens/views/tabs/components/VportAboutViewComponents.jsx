import { normalizeStringArray } from "@/features/profiles/kinds/vport/screens/views/tabs/vportAboutView.model";

export function Chips({ items }) {
  const list = normalizeStringArray(items);
  if (!list.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {list.map((x, i) => (
        <span
          key={`${x}-${i}`}
          className="
            inline-flex items-center
            px-3 py-1.5
            rounded-full
            text-xs font-medium
            bg-sky-300/10 text-sky-100
            border border-sky-300/25
          "
        >
          {x}
        </span>
      ))}
    </div>
  );
}

export function SectionCard({ title, subtitle, children }) {
  return (
    <section className="profiles-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-xs uppercase tracking-wider text-white/70/85">{title}</h4>
          {subtitle ? <div className="mt-1 text-xs text-white/50">{subtitle}</div> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[96px,1fr] gap-4 py-2">
      <div className="text-sm text-white/50">{label}</div>
      <div className="text-sm text-white break-words">{children}</div>
    </div>
  );
}

export function Divider() {
  return <div className="my-2 h-px bg-white/10" />;
}

export function LinkRow({ label, href, text }) {
  if (!href) return null;
  return (
    <Row label={label}>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="text-blue-400 hover:text-blue-300 underline decoration-white/15 hover:decoration-white/30"
      >
        {text || href}
      </a>
    </Row>
  );
}

// src/features/settings/components/Card.jsx
import { cx } from '../constants';

export default function Card({ title, children, className = '' }) {
  return (
    <section className={cx('rounded-2xl bg-zinc-900/80 text-white shadow-sm', className)}>
      {title ? <div className="px-4 pt-3 pb-2 text-xs tracking-wide text-zinc-400">{title}</div> : null}
      <div className="px-2 pb-2">{children}</div>
    </section>
  );
}

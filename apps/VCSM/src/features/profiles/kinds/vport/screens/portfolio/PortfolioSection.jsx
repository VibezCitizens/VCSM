export default function PortfolioSection({
  eyebrow = null,
  title,
  subtitle = null,
  action = null,
  children,
}) {
  if (!children) return null;

  return (
    <section className="profiles-portfolio-section profiles-card rounded-[1.65rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <div className="profiles-portfolio-section-eyebrow">
              {eyebrow}
            </div>
          ) : null}

          <h3 className="mt-2 text-xl font-semibold text-white sm:text-[1.35rem]">
            {title}
          </h3>

          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-slate-300/78">
              {subtitle}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

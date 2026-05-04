"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";

export default function HomepageTrendingSection({ groups }) {
  const { lang } = useTrafficLanguage();

  return (
    <section className="homepage-section homepage-section--divider homepage-trending-section homepage-directory-surface-soft" id="browse">
      <div className="homepage-section-heading">
        <h2 className="section-title">
          {lang === "es" ? "Búsquedas populares" : "Popular searches"}
        </h2>
        <p>
          {lang === "es"
            ? "Accesos rápidos al directorio por necesidad, tipo de servicio y ciudad."
            : "Useful directory shortcuts by need, service type, and city."}
        </p>
      </div>

      <div className="homepage-trending-groups">
        {groups.map((group) => {
          const groupTitle = lang === "es" && group.titleEs ? group.titleEs : group.title;
          const groupDescription = lang === "es" && group.descriptionEs ? group.descriptionEs : group.description;

          return (
            <article key={group.title} className="homepage-trending-group">
              <div className="homepage-trending-group-head">
                <h3 className="homepage-trending-title">{groupTitle}</h3>
                <p className="homepage-meta-note">{groupDescription}</p>
              </div>

              <ul className="homepage-directory-links">
                {group.links.map((link) => {
                  const linkLabel = lang === "es" && link.labelEs ? link.labelEs : link.label;
                  return (
                    <li key={`${group.title}-${link.label}`}>
                      <Link className="homepage-directory-link" href={link.href}>
                        <span>{linkLabel}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

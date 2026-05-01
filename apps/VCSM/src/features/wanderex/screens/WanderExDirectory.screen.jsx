import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useWanderExDirectory } from "@/features/wanderex/hooks/useWanderExDirectory";
import { useWanderExSeo } from "@/features/wanderex/hooks/useWanderExSeo";
import { useWanderExAnalytics } from "@/features/wanderex/hooks/useWanderExAnalytics";
import { humanizeCategory, slugifySegment } from "@/features/wanderex/model/wanderexPublic.model";
import { WanderExStarRating, WanderExTopNav } from "@/features/wanderex/components/WanderExTopNav";
import "@/features/wanderex/styles/wanderex-public.css";

function asBool(value) {
  return String(value || "").toLowerCase() === "1" || String(value || "").toLowerCase() === "true";
}

export function WanderExDirectoryScreen() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const track = useWanderExAnalytics({ page: "directory" });

  const routeCategory = String(params.category || "").trim().toLowerCase();
  const routeCity = String(params.city || "").trim();

  const cityQuery = String(searchParams.get("city") || "").trim();
  const city = routeCity || cityQuery;

  const openNow = asBool(searchParams.get("open_now"));
  const bookable = asBool(searchParams.get("bookable"));
  const topRated = asBool(searchParams.get("top_rated"));

  const { cards, facets, loading, error } = useWanderExDirectory({
    category: routeCategory,
    city,
    openNow,
    bookable,
    topRated,
    limit: 100,
  });

  const heading = useMemo(() => {
    if (routeCategory && city) return `${humanizeCategory(routeCategory)} in ${city}`;
    if (routeCategory) return humanizeCategory(routeCategory);
    if (city) return `Providers in ${city}`;
    return "All providers";
  }, [routeCategory, city]);

  useWanderExSeo({
    title: `${heading} | WanderEx Directory`,
    description: `Browse ${heading.toLowerCase()} on WanderEx. Filter by open now, bookable, and top rated providers.`,
    canonicalPath: location.pathname + location.search,
    imageUrl: "https://vibezcitizens.com/VportBusinnesCard.jpeg",
  });

  function setToggle(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, "1");
    else next.delete(key);

    navigate(`${location.pathname}?${next.toString()}`, { replace: true });
  }

  function navigateToCategory(category) {
    const slug = slugifySegment(category);
    if (!slug) return;
    navigate(`/us/${slug}`);
  }

  function navigateToCity(nextCity) {
    const slug = slugifySegment(nextCity);
    if (!slug) return;

    if (routeCategory) {
      navigate(`/us/${routeCategory}/${slug}`);
      return;
    }

    navigate(`/us?city=${encodeURIComponent(nextCity)}`);
  }

  return (
    <div className="wx-page">
      <WanderExTopNav />
      <main className="wx-container">
        <section className="wx-hero-copy">
          <h1 className="wx-hero-title">{heading}</h1>
          <p className="wx-hero-subtitle">
            Browse and compare local service providers. No account needed.
          </p>
        </section>

        <section className="wx-section">
          <div className="wx-filter-row" role="group" aria-label="Directory filters">
            <button
              type="button"
              className={`wx-filter-btn ${openNow ? "is-on" : ""}`}
              onClick={() => setToggle("open_now", !openNow)}
            >
              Open now
            </button>
            <button
              type="button"
              className={`wx-filter-btn ${bookable ? "is-on" : ""}`}
              onClick={() => setToggle("bookable", !bookable)}
            >
              Bookable
            </button>
            <button
              type="button"
              className={`wx-filter-btn ${topRated ? "is-on" : ""}`}
              onClick={() => setToggle("top_rated", !topRated)}
            >
              Top rated
            </button>
          </div>

          {!!facets.categories.length && (
            <div className="wx-filter-row">
              {facets.categories.slice(0, 12).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`wx-filter-btn ${routeCategory === item ? "is-on" : ""}`}
                  onClick={() => navigateToCategory(item)}
                >
                  {humanizeCategory(item)}
                </button>
              ))}
            </div>
          )}

          {!!facets.cities.length && (
            <div className="wx-filter-row">
              {facets.cities.slice(0, 12).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`wx-filter-btn ${slugifySegment(city) === slugifySegment(item) ? "is-on" : ""}`}
                  onClick={() => navigateToCity(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="wx-directory-grid">
          {loading ? <p className="wx-empty">Loading providers...</p> : null}
          {error ? <p className="wx-field-error">{error.message || "Failed to load directory."}</p> : null}

          {!loading && !error && cards.length === 0 ? (
            <p className="wx-empty">No visible providers match these filters.</p>
          ) : null}

          {cards.map((card) => (
            <article key={card.profileId} className="wx-directory-card">
              <div className="wx-row">
                <img
                  className="wx-avatar"
                  src={card.avatarUrl || "/avatar.jpg"}
                  alt={card.name}
                  loading="lazy"
                />
                <div>
                  <div className="wx-name">{card.name}</div>
                  <div className="wx-muted">
                    {card.categoryLabel}
                    {card.city ? ` · ${card.city}` : ""}
                  </div>
                  <WanderExStarRating value={card.ratingAverage} count={card.ratingCount} />
                </div>
              </div>

              <div className="wx-directory-meta">
                {card.isOpenNow ? <span className="wx-tag open">Open now</span> : null}
                {card.isBookable ? <span className="wx-tag bookable">Bookable</span> : null}
              </div>

              <div className="wx-card-actions">
                <Link to={`/p/${card.slug}`} className="wx-secondary-btn">
                  View profile
                </Link>
                <Link
                  to={`/p/${card.slug}/book`}
                  className="wx-primary-btn"
                  onClick={() =>
                    track("booking_started", {
                      source: "directory_card",
                      slug: card.slug,
                    })
                  }
                >
                  Book
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default WanderExDirectoryScreen;

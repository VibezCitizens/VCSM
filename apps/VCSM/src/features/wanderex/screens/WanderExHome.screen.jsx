import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWanderExDirectory } from "@/features/wanderex/hooks/useWanderExDirectory";
import { useWanderExSeo } from "@/features/wanderex/hooks/useWanderExSeo";
import { useWanderExAnalytics } from "@/features/wanderex/hooks/useWanderExAnalytics";
import { slugifySegment } from "@/features/wanderex/model/wanderexPublic.model";
import { WanderExStarRating, WanderExTopNav } from "@/features/wanderex/components/WanderExTopNav";
import "@/features/wanderex/styles/wanderex-public.css";

export function WanderExHomeScreen() {
  const navigate = useNavigate();
  const track = useWanderExAnalytics({ page: "home" });

  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const { cards, loading } = useWanderExDirectory({ topRated: true, bookable: true, limit: 8 });

  useWanderExSeo({
    title: "WanderEx | Discover and book local providers",
    description:
      "Public discovery for Vibez Citizens + VPORT. Find local providers, view public profile hubs, and send booking requests instantly.",
    canonicalPath: "/",
    imageUrl: "https://vibezcitizens.com/VportBusinnesCard.jpeg",
  });

  const topCategories = useMemo(() => {
    return [...new Set(cards.map((item) => item.categoryLabel).filter(Boolean))].slice(0, 8);
  }, [cards]);

  function handleSearch(event) {
    event.preventDefault();

    const categorySlug = slugifySegment(category);
    const citySlug = slugifySegment(city);

    if (categorySlug && citySlug) {
      navigate(`/us/${categorySlug}/${citySlug}`);
      return;
    }

    if (categorySlug) {
      navigate(`/us/${categorySlug}`);
      return;
    }

    navigate(citySlug ? `/us?city=${encodeURIComponent(city)}` : "/us");
  }

  return (
    <div className="wx-page">
      <WanderExTopNav />
      <main className="wx-container">
        <section className="wx-hero-copy">
          <h1 className="wx-hero-title">Discover trusted local providers in seconds.</h1>
          <p className="wx-hero-subtitle">
            WanderEx is the public expansion layer for Vibez Citizens + VPORT. Search, compare, and send
            booking requests without signup friction.
          </p>
        </section>

        <section className="wx-section">
          <form onSubmit={handleSearch}>
            <div className="wx-search-row">
              <input
                className="wx-input"
                placeholder="Category (barber, locksmith, salon...)"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
              <input
                className="wx-input"
                placeholder="City"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>
            <div className="wx-step-actions">
              <Link to="/us" className="wx-secondary-btn">
                Browse all providers
              </Link>
              <button
                type="submit"
                className="wx-primary-btn"
                onClick={() => track("cta_click", { cta: "homepage_search" })}
              >
                Search now
              </button>
            </div>
          </form>
        </section>

        {!!topCategories.length && (
          <section className="wx-section">
            <h2 className="wx-section-title">Trending categories</h2>
            <div className="wx-chip-row">
              {topCategories.map((item) => (
                <Link key={item} to={`/us/${slugifySegment(item)}`} className="wx-chip">
                  {item}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="wx-section">
          <div className="wx-space-between">
            <h2 className="wx-section-title">Top rated and bookable right now</h2>
            <Link to="/us" className="wx-secondary-btn">
              View directory
            </Link>
          </div>

          {loading ? (
            <p className="wx-empty">Loading featured providers...</p>
          ) : cards.length === 0 ? (
            <p className="wx-empty">No providers are visible yet.</p>
          ) : (
            <div className="wx-directory-grid">
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

                  <div className="wx-card-actions">
                    <Link to={`/p/${card.slug}`} className="wx-secondary-btn">
                      View profile
                    </Link>
                    <Link
                      to={`/p/${card.slug}/book`}
                      className="wx-primary-btn"
                      onClick={() => track("booking_started", { source: "home_card", slug: card.slug })}
                    >
                      Book
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default WanderExHomeScreen;

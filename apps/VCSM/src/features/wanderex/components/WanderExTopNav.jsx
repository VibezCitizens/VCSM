import { Link, useLocation } from "react-router-dom";

export function WanderExTopNav() {
  const location = useLocation();

  const links = [
    { to: "/wx", label: "Home" },
    { to: "/us", label: "Directory" },
  ];

  return (
    <header className="wx-top-nav">
      <div className="wx-container">
        <Link to="/wx" className="wx-brand">
          WanderEx
        </Link>
        <nav className="wx-nav-row" aria-label="WanderEx navigation">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`wx-nav-link ${location.pathname === link.to ? "is-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function WanderExStarRating({ value, count }) {
  if (!Number.isFinite(Number(value))) {
    return <span className="wx-muted">No reviews yet</span>;
  }

  const rounded = Math.round(Number(value));
  const stars = Array.from({ length: 5 }, (_, index) => (index < rounded ? "★" : "☆")).join("");

  return (
    <span className="wx-rating">
      <span className="wx-review-stars">{stars}</span> {Number(value).toFixed(1)} ({count || 0})
    </span>
  );
}

export default WanderExTopNav;

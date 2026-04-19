import Link from "next/link";

export function AppShell({ children }) {
  return (
    <>
      <header className="traffic-shell-header">
        <div className="traffic-shell-inner">
          <Link className="traffic-shell-brand" href="/">
            TRAZE
          </Link>
          <nav className="traffic-shell-nav">
            <Link className="pill" href="/">
              Home
            </Link>
            <a
              className="pill"
              href="https://vibezcitizens.com"
              target="_blank"
              rel="noreferrer"
            >
              Main Platform
            </a>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}

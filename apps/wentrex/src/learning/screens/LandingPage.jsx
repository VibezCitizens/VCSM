import { useNavigate } from "react-router-dom";

const PRIMARY = "#0f4a72";
const PRIMARY_LIGHT = "#1a6ba0";
const ACCENT = "#2d7dd2";
const SURFACE = "#f8fafc";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const DARK = "#0a1628";

function NavBar() {
  const navigate = useNavigate();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 32px",
        background: DARK,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/WENTREX.png" alt="WENTREX" style={{ height: 56 }} />
      </div>
      <div />
    </nav>
  );
}

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #0d1f3c 40%, ${PRIMARY} 100%)`,
        color: "#fff",
        padding: "100px 32px 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle glow effect matching the logo */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,125,210,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 800,
            lineHeight: 1.2,
            margin: "0 0 22px",
            letterSpacing: "-0.02em",
          }}
        >
          The modern LMS built for
          <br />
          <span style={{ color: ACCENT }}>how schools actually work</span>
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.7,
            margin: "0 0 40px",
            opacity: 0.8,
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Manage your school, deliver courses, track student progress,
          and keep parents connected — all from one secure workspace
          assigned by your organization.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "15px 36px",
              borderRadius: 12,
              border: "none",
              background: "#fff",
              color: PRIMARY,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            Staff & Parent Login
          </button>
          <button
            onClick={() => navigate("/student-login")}
            style={{
              padding: "15px 36px",
              borderRadius: 12,
              border: "2px solid rgba(255,255,255,0.25)",
              background: "transparent",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Student Login
          </button>
        </div>
      </div>
    </section>
  );
}

function RoleCard({ title, description, features, accent }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 28,
        border: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent || PRIMARY; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: accent || PRIMARY, opacity: 0.1, position: "absolute",
      }} />
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: PRIMARY }}>{title}</h3>
      <p style={{ margin: 0, color: MUTED, lineHeight: 1.6, fontSize: 14 }}>{description}</p>
      <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#334155", lineHeight: 2, fontSize: 14 }}>
        {features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

function RolesSection() {
  return (
    <section style={{ padding: "72px 32px", background: SURFACE }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5 }}>Who It's For</span>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: "8px 0 0", color: "#0f172a" }}>
            One workspace, every role
          </h2>
          <p style={{ color: MUTED, fontSize: 16, margin: "10px auto 0", maxWidth: 540 }}>
            Everyone signs into the same platform. What you see depends on your role, assigned by your school.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          <RoleCard
            title="Administration"
            description="Run your school from one place."
            accent="#0f4a72"
            features={[
              "Manage staff, teachers, and students",
              "Create and organize courses",
              "Control access and permissions",
              "Link parents to student accounts",
            ]}
          />
          <RoleCard
            title="Teachers"
            description="Teach, grade, and communicate."
            accent="#166534"
            features={[
              "Deliver course content and lessons",
              "Create and manage assignments",
              "Review and grade submissions",
              "Message students and parents",
            ]}
          />
          <RoleCard
            title="Parents"
            description="See how your child is doing."
            accent="#854d0e"
            features={[
              "View your child's courses and grades",
              "Track assignment completion",
              "Monitor lesson progress",
              "Message teachers directly",
            ]}
          />
          <RoleCard
            title="Students"
            description="Learn, submit, and grow."
            accent="#6b21a8"
            features={[
              "Access your courses and lessons",
              "Submit assignments and upload work",
              "View grades and teacher feedback",
              "Message your teachers",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { title: "School management", desc: "Each school operates in its own secure environment with dedicated data, users, and settings." },
    { title: "Secure by design", desc: "Every user only sees what they're supposed to. Permissions are enforced at every level automatically." },
    { title: "Course builder", desc: "Create courses, organize modules and lessons, and build assignments with a structured curriculum workflow." },
    { title: "Grading & feedback", desc: "Teachers review student submissions, assign scores, and deliver feedback — all from one screen." },
    { title: "Parent involvement", desc: "Parents stay connected to their child's academic journey with full visibility into courses, grades, and progress." },
    { title: "Built-in messaging", desc: "Teachers, parents, and students communicate directly within the platform — no external tools needed." },
  ];

  return (
    <section style={{ padding: "72px 32px", background: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5 }}>Why WENTREX</span>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: "8px 0 0", color: "#0f172a" }}>
            Everything your school needs
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 28,
          }}
        >
          {features.map((f, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                {f.title}
              </h4>
              <p style={{ margin: 0, color: MUTED, lineHeight: 1.7, fontSize: 14 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        padding: "28px 32px",
        background: DARK,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <img src="/WENTREX.png" alt="WENTREX" style={{ height: 24, opacity: 0.7 }} />
      <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
        WENTREX &middot; A modern learning management system
      </p>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <HeroSection />
      <RolesSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}

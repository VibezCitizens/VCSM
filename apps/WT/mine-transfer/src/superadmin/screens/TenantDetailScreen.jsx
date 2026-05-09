import { useParams, useNavigate } from "react-router-dom";
import { useSuperAdminContext } from "@/superadmin/SuperAdminLayout";
import { useEffect, useState } from "react";

export default function TenantDetailScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { supabase } = useSuperAdminContext();
  const [tenant, setTenant] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !slug) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: realm } = await supabase
          .schema("learning")
          .from("realms")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (!realm || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }

        const [orgResult, courseResult] = await Promise.all([
          supabase
            .schema("learning")
            .from("organizations")
            .select("id, name, slug, is_active, created_at")
            .eq("realm_id", realm.id),
          supabase
            .schema("learning")
            .from("courses")
            .select("id, title, slug, status, created_at, organization_id")
            .eq("realm_id", realm.id),
        ]);

        if (!cancelled) {
          setTenant(realm);
          setOrgs(orgResult.data ?? []);
          setCourses(courseResult.data ?? []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [supabase, slug]);

  if (loading) {
    return (
      <div className="sa-loading">
        <div className="sa-spinner" />
        <span>Loading tenant...</span>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div>
        <div className="sa-error-box">Tenant "{slug}" not found.</div>
        <button className="sa-btn-ghost" onClick={() => navigate("/admin")}>
          Back to dashboard
        </button>
      </div>
    );
  }

  const activeCourses = courses.filter(
    (c) => c.status === "published" || c.status === "active",
  );

  return (
    <div>
      {/* Back + Title */}
      <button
        type="button"
        className="sa-btn-ghost"
        onClick={() => navigate("/admin")}
        style={{ marginBottom: 20 }}
      >
        &larr; All Tenants
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{tenant.name}</h1>
        <span className={`sa-badge ${tenant.is_active ? "active" : "inactive"}`}>
          {tenant.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      <div style={{ color: "var(--sa-text-dim)", fontSize: 13, fontFamily: "monospace", marginBottom: 28 }}>
        /{tenant.slug}
      </div>

      {/* Stats */}
      <div className="sa-stats">
        <div className="sa-stat-card">
          <div className="sa-stat-label">Organizations</div>
          <div className="sa-stat-value accent">{orgs.length}</div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-label">Total Courses</div>
          <div className="sa-stat-value accent">{courses.length}</div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-label">Active Courses</div>
          <div className="sa-stat-value success">{activeCourses.length}</div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-label">Created</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>
            {tenant.created_at
              ? new Date(tenant.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "-"}
          </div>
        </div>
      </div>

      {/* Organizations */}
      <div className="sa-section-header">
        <h2 className="sa-section-title">Organizations</h2>
      </div>

      {orgs.length === 0 ? (
        <div className="sa-card">
          <div className="sa-empty">No organizations in this tenant.</div>
        </div>
      ) : (
        <div className="sa-card" style={{ marginBottom: 28 }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{org.name}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--sa-text-dim)" }}>
                      /{org.slug}
                    </div>
                  </td>
                  <td>
                    <span className={`sa-badge ${org.is_active ? "active" : "inactive"}`}>
                      {org.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ color: "var(--sa-text-dim)", fontSize: 13 }}>
                    {org.created_at
                      ? new Date(org.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Courses */}
      <div className="sa-section-header">
        <h2 className="sa-section-title">Courses</h2>
      </div>

      {courses.length === 0 ? (
        <div className="sa-card">
          <div className="sa-empty">No courses in this tenant.</div>
        </div>
      ) : (
        <div className="sa-card">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{course.title}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--sa-text-dim)" }}>
                      /{course.slug}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`sa-badge ${
                        course.status === "published" || course.status === "active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {course.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--sa-text-dim)", fontSize: 13 }}>
                    {course.created_at
                      ? new Date(course.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

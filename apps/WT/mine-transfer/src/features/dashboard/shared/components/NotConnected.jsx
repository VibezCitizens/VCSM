import { Panel } from "@/features/dashboard/components/dashboardPrimitives";

export default function NotConnected({ product, table, description, items }) {
  return (
    <section className="quick-glance" aria-label={`${product ?? "Product"} not connected`}>
      <div className="quick-glance__heading">
        <span>{product ?? "Data source"}</span>
        <h2>Not connected yet</h2>
      </div>
      <Panel eyebrow="Status" title={table ?? "No data source"} className="panel-wide">
        <p style={{ color: "var(--dash-muted)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
          {description ?? "This section will be wired once the backend data source is connected."}
        </p>
        {items?.length > 0 && (
          <ul style={{ marginTop: "1rem", paddingLeft: "1.25rem", color: "var(--dash-muted)", fontSize: "0.875rem", lineHeight: 1.8 }}>
            {items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
      </Panel>
    </section>
  );
}

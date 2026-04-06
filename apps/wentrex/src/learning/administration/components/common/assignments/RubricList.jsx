export default function RubricList({ rubric = [] }) {
  if (!rubric.length) return null;

  return (
    <div className="learning-card" style={{ padding: 20 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Grading Rubric</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--learning-border)" }}>
            <th style={{ textAlign: "left", padding: "6px 0", color: "var(--learning-muted-text)", fontWeight: 600 }}>
              Criterion
            </th>
            <th style={{ textAlign: "right", padding: "6px 0", color: "var(--learning-muted-text)", fontWeight: 600 }}>
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {rubric.map((item) => (
            <tr key={item.id ?? item.criterionKey} style={{ borderBottom: "1px solid var(--learning-border)" }}>
              <td style={{ padding: "10px 0", color: "var(--learning-text)" }}>
                {item.criterionLabel ?? item.criterionKey}
              </td>
              <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "var(--learning-primary)" }}>
                {item.pointsPossible}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ padding: "10px 0", fontWeight: 700, color: "var(--learning-text)" }}>Total</td>
            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "var(--learning-primary)" }}>
              {rubric.reduce((sum, item) => sum + (item.pointsPossible ?? 0), 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

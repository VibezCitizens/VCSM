export default function RubricList({ rubric = [] }) {
  if (!rubric.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">Rubric</h4>

      {rubric.map((item) => (
        <div
          key={item.id}
          className="border p-3 rounded-md flex justify-between text-sm"
        >
          <span>{item.criterionLabel}</span>
          <span className="text-gray-500">
            {item.pointsPossible} pts
          </span>
        </div>
      ))}
    </div>
  );
}
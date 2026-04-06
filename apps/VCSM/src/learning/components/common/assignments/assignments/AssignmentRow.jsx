export default function AssignmentRow({ assignment, submissionSummary }) {
  return (
    <div className="p-4 border rounded-md hover:bg-gray-50 transition">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">{assignment.title}</h4>
          <p className="text-xs text-gray-500">
            {assignment.pointsPossible} pts
          </p>
        </div>

        <div className="text-right text-xs text-gray-500">
          {assignment.dueAt && (
            <p>Due {new Date(assignment.dueAt).toLocaleDateString()}</p>
          )}

          {submissionSummary?.status && (
            <p className="mt-1">{submissionSummary.status}</p>
          )}
        </div>
      </div>
    </div>
  );
}
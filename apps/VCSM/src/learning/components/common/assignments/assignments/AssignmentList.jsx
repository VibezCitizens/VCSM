export default function AssignmentList({
  assignments = [],
  onOpenAssignment,
}) {
  if (!assignments.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {assignments.map((assignment) => (
        <div key={assignment.id}>
          {onOpenAssignment ? (
            <button
              onClick={() => onOpenAssignment(assignment)}
              className="w-full text-left"
            >
              <AssignmentRow assignment={assignment} />
            </button>
          ) : (
            <AssignmentRow assignment={assignment} />
          )}
        </div>
      ))}
    </div>
  );
}

import AssignmentRow from "./AssignmentRow";
export default function CourseHeader({
  course,
  capabilities,
  onOpenContent,
  onOpenAssignments,
}) {
  if (!course) return null;

  return (
    <div className="w-full flex items-center justify-between border-b pb-4">
      <div>
        <h1 className="text-xl font-semibold">{course.title}</h1>

        {course.code && (
          <p className="text-sm text-gray-500">{course.code}</p>
        )}
      </div>

      <div className="flex gap-2">
        {onOpenContent && (
          <button
            onClick={onOpenContent}
            className="px-3 py-2 text-sm border rounded-md"
          >
            Content
          </button>
        )}

        {onOpenAssignments && (
          <button
            onClick={onOpenAssignments}
            className="px-3 py-2 text-sm border rounded-md"
          >
            Assignments
          </button>
        )}

        {capabilities?.canManageCourse && (
          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
            Instructor
          </span>
        )}
      </div>
    </div>
  );
}
export default function CourseSidebar({
  course,
  assignmentCount = 0,
  moduleCount = 0,
  progressPercent = 0,
}) {
  if (!course) return null;

  return (
    <div className="w-full border rounded-md p-4 flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-medium mb-1">Overview</h4>
        <p className="text-xs text-gray-500">
          {moduleCount} modules · {assignmentCount} assignments
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-1">Progress</h4>
        <div className="w-full bg-gray-100 rounded h-2 overflow-hidden">
          <div
            className="bg-black h-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progressPercent}% complete
        </p>
      </div>

      {course.publishedAt && (
        <div>
          <h4 className="text-sm font-medium mb-1">Published</h4>
          <p className="text-xs text-gray-500">
            {new Date(course.publishedAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
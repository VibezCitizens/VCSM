export default function CourseHero({ course }) {
  if (!course) return null;

  return (
    <div className="w-full border rounded-md overflow-hidden">
      {course.coverImageUrl && (
        <img
          src={course.coverImageUrl}
          alt={course.title}
          className="w-full h-40 object-cover"
        />
      )}

      <div className="p-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{course.title}</h2>

        {course.description && (
          <p className="text-sm text-gray-600">
            {course.description}
          </p>
        )}

        <div className="flex gap-3 text-xs text-gray-500 mt-2">
          {course.status && <span>Status: {course.status}</span>}
          {course.visibility && <span>Visibility: {course.visibility}</span>}
        </div>
      </div>
    </div>
  );
}
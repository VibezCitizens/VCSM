import CourseHeader from "@/learning/components/common/course/CourseHeader";
import CourseHero from "@/learning/components/common/course/CourseHero";
import CourseSidebar from "@/learning/components/common/course/CourseSidebar";
import ModuleList from "@/learning/components/common/modules/ModuleList";
import AssignmentList from "@/learning/components/common/assignments/AssignmentList";
import LearningEmptyState from "@/learning/components/shared/LearningEmptyState";

function buildLessonsByModuleId(lessons = []) {
  return lessons.reduce((acc, lesson) => {
    const key = lesson.moduleId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(lesson);
    return acc;
  }, {});
}

function buildProgressByLessonId(progress = []) {
  return progress.reduce((acc, item) => {
    acc[item.lessonId] = item;
    return acc;
  }, {});
}

function calculateProgressPercent(lessons = [], progress = []) {
  if (!lessons.length) return 0;

  const completedCount = progress.filter(
    (item) => item?.state === "completed"
  ).length;

  return Math.max(
    0,
    Math.min(100, Math.round((completedCount / lessons.length) * 100))
  );
}

export default function LearningCourseViewScreen({
  course,
  capabilities,
  modules = [],
  lessons = [],
  progress = [],
  assignments = [],
  onOpenLesson,
  onOpenAssignment,
  onOpenContent,
  onOpenAssignments,
}) {
  if (!course) {
    return (
      <LearningEmptyState
        title="Course not found"
        message="There is no course data available."
      />
    );
  }

  const lessonsByModuleId = buildLessonsByModuleId(lessons);
  const progressByLessonId = buildProgressByLessonId(progress);
  const progressPercent = calculateProgressPercent(lessons, progress);

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#000000",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: 24,
        alignItems: "start",
      }}
    >
      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <CourseHeader
          course={course}
          capabilities={capabilities}
          onOpenContent={onOpenContent}
          onOpenAssignments={onOpenAssignments}
        />

        <CourseHero course={course} />

        <section>
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Course Content
          </h2>

          {modules.length ? (
            <ModuleList
              modules={modules}
              lessonsByModuleId={lessonsByModuleId}
              progressByLessonId={progressByLessonId}
              onOpenLesson={onOpenLesson}
            />
          ) : (
            <LearningEmptyState
              title="No modules yet"
              message="This course does not have any modules available."
            />
          )}
        </section>

        <section>
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Assignments
          </h2>

          {assignments.length ? (
            <AssignmentList
              assignments={assignments}
              onOpenAssignment={onOpenAssignment}
            />
          ) : (
            <LearningEmptyState
              title="No assignments yet"
              message="This course does not have any assignments available."
            />
          )}
        </section>
      </div>

      <div style={{ minWidth: 0 }}>
        <CourseSidebar
          course={course}
          assignmentCount={assignments.length}
          moduleCount={modules.length}
          progressPercent={progressPercent}
        />
      </div>
    </div>
  );
}
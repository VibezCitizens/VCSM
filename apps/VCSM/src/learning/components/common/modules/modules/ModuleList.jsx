import ModuleCard from "@/learning/components/common/modules/ModuleCard";

export default function ModuleList({
  modules = [],
  lessonsByModuleId = {},
  progressByLessonId = {},
  onOpenLesson,
}) {
  if (!modules.length) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          lessons={lessonsByModuleId?.[module.id] ?? []}
          progressByLessonId={progressByLessonId}
          onOpenLesson={onOpenLesson}
        />
      ))}
    </div>
  );
}
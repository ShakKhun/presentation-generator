/**
 * Lesson metadata helpers.
 */

export function getLessonTitle(lesson) {
  if (!lesson?.slides?.length) return "Lesson";
  const titleSlide = lesson.slides.find((s) => s.type === "title");
  return titleSlide?.title?.trim() || "Lesson";
}

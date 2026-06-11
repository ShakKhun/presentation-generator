/**
 * Shared utilities for lesson parsing and safe HTML output.
 */

export const WORD_BANK_SIZE = 6;
export const DEFAULT_THEME = "light-modern";
export const THEMES = ["light-modern", "dark-academy", "pink-girly"];

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function resolveTheme(lesson, override) {
  const value = override || lesson?.theme || DEFAULT_THEME;
  return THEMES.includes(value) ? value : DEFAULT_THEME;
}

export function parseLessonJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const trimmed = text.trim();
    if (trimmed.length > 0 && !trimmed.startsWith("[")) {
      try {
        data = JSON.parse("[" + text + "]");
      } catch {
        throw e;
      }
    } else {
      throw e;
    }
  }

  if (Array.isArray(data)) {
    return { theme: DEFAULT_THEME, slides: data };
  }
  if (data && typeof data === "object" && data.type && !data.slides) {
    return { theme: DEFAULT_THEME, slides: [data] };
  }
  if (!data || typeof data !== "object") {
    throw new Error("Root must be a JSON array, object, or slide object.");
  }
  if (!Array.isArray(data.slides)) {
    throw new Error('Lesson must include a "slides" array.');
  }
  return data;
}

export function mergeHiddenSlides(lesson) {
  if (!lesson.hiddenSlides || !Array.isArray(lesson.hiddenSlides) || lesson.hiddenSlides.length === 0) {
    return lesson;
  }
  const slides = [...lesson.slides];
  const lastListIndex = slides.map((s, i) => ({ slide: s, index: i }))
    .filter(({ slide }) => slide.type === "list" && !slide.hiddenSlides)
    .pop()?.index;
  if (lastListIndex !== undefined) {
    slides[lastListIndex] = { ...slides[lastListIndex], hiddenSlides: lesson.hiddenSlides };
  }
  const { hiddenSlides, ...rest } = lesson;
  return { ...rest, slides };
}

export function applyTheme(rootEl, themeName) {
  rootEl.setAttribute("data-theme", themeName);
}

export function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wrap highlight phrases in <mark> (longest phrases first).
 * @param {string} text - Raw paragraph text
 * @param {string[]} highlights - Words or multi-word phrases to emphasize
 */
export function applyHighlights(text, highlights) {
  let html = escapeHtml(text);
  if (!highlights?.length) return html;

  const phrases = [...new Set(highlights.filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );

  for (const phrase of phrases) {
    const pattern = escapeRegExp(escapeHtml(phrase));
    html = html.replace(
      new RegExp(pattern, "gi"),
      (match) => `<mark class="text-highlight">${match}</mark>`
    );
  }

  return html;
}

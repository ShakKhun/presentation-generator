/**
 * Shared utilities for lesson parsing and safe HTML output.
 */

export const WORD_BANK_SIZE = 6;
export const DEFAULT_THEME = "light-modern";
export const THEMES = ["light-modern", "dark-academy"];

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
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") {
    throw new Error("Root must be a JSON object.");
  }
  if (!Array.isArray(data.slides)) {
    throw new Error('Lesson must include a "slides" array.');
  }
  return data;
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

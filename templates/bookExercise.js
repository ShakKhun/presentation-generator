/**
 * Book-exercise — word bank at top, fill-in-the-blank sentences below.
 *
 * JSON shape:
 * {
 *   "type": "book-exercise",
 *   "title": "Fill in the blanks",
 *   "badge": "Exercise",
 *   "words": ["always", "usually", "often", "sometimes", "rarely", "never"],
 *   "items": [
 *     { "text": "I _____ drink coffee.", "answer": "always" },
 *     { "text": "She _____ walks to work.", "answer": "usually" }
 *   ]
 * }
 */

import { escapeHtml } from "../js/utils.js";
import {
  renderBlankPrompt,
  renderBlankAnswer,
  toggleBookAnswers,
} from "./fillBlank.js";

const MAX_BOOK_ITEMS = 10;

export function renderBookExerciseSlide(slide, _index, showAnswers = false) {
  const words = Array.isArray(slide.words) ? slide.words : [];
  const wordPills = words
    .map((w) => `<span class="book-word">${escapeHtml(w)}</span>`)
    .join("");

  const items = Array.isArray(slide.items)
    ? slide.items.slice(0, MAX_BOOK_ITEMS)
    : [];

  const promptsHtml = items
    .map((item, i) => {
      const text = item.text || item.sentence || "";
      return (
        `<div class="book-prompt">` +
        `<span class="book-num">${i + 1}.</span> ` +
        renderBlankPrompt(text) +
        `</div>`
      );
    })
    .join("");

  const answersHtml = items
    .map((item, i) => {
      const text = item.text || item.sentence || "";
      const answer = item.answer || "";
      const answered = renderBlankAnswer(text, answer);
      return (
        `<div class="book-answer-line">` +
        `<span class="book-num">${i + 1}.</span> ` +
        answered +
        `</div>`
      );
    })
    .join("");

  return (
    `<section class="slide-book-exercise" data-slide-type="book-exercise">` +
    `<div class="slide-oral-inner">` +
    `<span class="slide-badge slide-badge-oral">${escapeHtml(slide.badge || "Exercise")}</span>` +
    `<h2 class="oral-title">${escapeHtml(slide.title || "Fill in the blanks")}</h2>` +
    `<div class="book-words" aria-label="Word bank">${wordPills}</div>` +
    `<div class="book-prompts">${promptsHtml}</div>` +
    `<button type="button" class="book-toggle-btn" aria-expanded="false">Show answers</button>` +
    `<div class="book-answers duo-card-answer"${showAnswers ? "" : " hidden"}>` +
    answersHtml +
    `</div>` +
    `</div></section>`
  );
}

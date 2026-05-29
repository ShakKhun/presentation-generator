/**
 * Error correction — oral practice: wrong sentence + correct answer shown.
 *
 * {
 *   "type": "error-correction",
 *   "items": [
 *     {
 *       "incorrect": "She don't like coffee.",
 *       "correct": "She doesn't like coffee.",
 *       "hint": "3rd person"
 *     }
 *   ]
 * }
 */

import { escapeHtml } from "../js/utils.js";

const MAX_ERROR_ITEMS = 4;

export function renderErrorCorrectionItem(item, index) {
  const correct = item.correct || item.answer || "";

  return (
    `<div class="oral-item error-item">` +
    `<p class="oral-item-label">${index + 1}</p>` +
    `<div class="error-wrong duo-card-soft">` +
    `<span class="answer-icon-wrong" aria-hidden="true">✗</span>` +
    `<span>${escapeHtml(item.incorrect || "")}</span>` +
    `</div>` +
    (item.hint ? `<p class="error-hint">${escapeHtml(item.hint)}</p>` : "") +
    `<div class="error-right duo-card-answer">` +
    `<span class="answer-icon" aria-hidden="true">✓</span>` +
    `<span>${escapeHtml(correct)}</span>` +
    `</div></div>`
  );
}

export function renderErrorCorrectionSlide(slide) {
  const items = Array.isArray(slide.items)
    ? slide.items.slice(0, MAX_ERROR_ITEMS)
    : [];

  return (
    `<section class="slide-oral slide-error" data-slide-type="error-correction">` +
    `<div class="slide-oral-inner">` +
    (slide.badge
      ? `<span class="slide-badge slide-badge-oral">${escapeHtml(slide.badge)}</span>`
      : `<span class="slide-badge slide-badge-oral">Fix it</span>`) +
    `<h2 class="oral-title">${escapeHtml(slide.title || "Error correction")}</h2>` +
    (slide.intro
      ? `<p class="oral-intro">${escapeHtml(slide.intro)}</p>`
      : "") +
    `<div class="oral-list">` +
    items.map(renderErrorCorrectionItem).join("") +
    `</div></div></section>`
  );
}

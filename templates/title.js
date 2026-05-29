/**
 * Title slide template — hero slide for lesson openers.
 */

import { escapeHtml } from "../js/utils.js";

export function renderTitleSlide(slide) {
  return (
    `<section class="slide-title">` +
    `<span class="title-accent" aria-hidden="true"></span>` +
    `<h1>${escapeHtml(slide.title || "Untitled Lesson")}</h1>` +
    (slide.subtitle
      ? `<p class="subtitle">${escapeHtml(slide.subtitle)}</p>`
      : "") +
    `</section>`
  );
}

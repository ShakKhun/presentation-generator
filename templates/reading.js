/**
 * Reading slide — headings, paragraphs, optional highlights.
 *
 * JSON:
 * {
 *   "type": "reading",
 *   "badge": "Reading",
 *   "title": "Slide title",
 *   "intro": "Optional short instruction",
 *   "blocks": [
 *     { "type": "heading", "text": "Section title" },
 *     {
 *       "type": "paragraph",
 *       "text": "Full paragraph text…",
 *       "highlights": ["phrase one", "two words"]
 *     }
 *   ]
 * }
 */

import { escapeHtml, applyHighlights } from "../js/utils.js";

export function renderReadingBlock(block) {
  if (!block || !block.text) return "";

  if (block.type === "heading") {
    return `<h3 class="reading-heading">${escapeHtml(block.text)}</h3>`;
  }

  const body = applyHighlights(block.text, block.highlights);
  return `<p class="reading-paragraph">${body}</p>`;
}

export function renderReadingSlide(slide) {
  const blocks = Array.isArray(slide.blocks) ? slide.blocks : [];
  const blocksHtml = blocks.map(renderReadingBlock).join("");

  return (
    `<section class="slide-reading" data-slide-type="reading">` +
    `<div class="slide-reading-inner duo-card">` +
    (slide.badge
      ? `<span class="slide-badge">${escapeHtml(slide.badge)}</span>`
      : `<span class="slide-badge">Reading</span>`) +
    `<h2 class="reading-title">${escapeHtml(slide.title || "Reading")}</h2>` +
    (slide.intro
      ? `<p class="reading-intro">${escapeHtml(slide.intro)}</p>`
      : "") +
    `<div class="reading-body">${blocksHtml}</div>` +
    `</div></section>`
  );
}

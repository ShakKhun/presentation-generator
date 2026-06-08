/**
 * Grammar-form — practice correct grammatical forms for given prompts.
 *
 * JSON shape:
 * {
 *   "type": "grammar-form",
 *   "title": "Past Simple Practice",
 *   "badge": "Grammar",
 *   "items": [
 *     { "text": "Yesterday I _____ (go) to the park.", "answer": "went" },
 *     { "text": "She _____ (buy) a new car last week.", "answer": "bought" }
 *   ]
 * }
 */

import { escapeHtml } from "../js/utils.js";
import { renderBlankItem } from "./fillBlank.js";

const MAX_GRAMMAR_ITEMS = 8;

export function renderGrammarFormSlide(slide, _index, showAnswers = false) {
  const items = Array.isArray(slide.items)
    ? slide.items.slice(0, MAX_GRAMMAR_ITEMS)
    : [];
  const itemsHtml = items
    .map((item, i) => renderBlankItem(item, i, showAnswers))
    .join("");

  return (
    `<section class="slide-grammar-form" data-slide-type="grammar-form">` +
    `<div class="slide-oral-inner">` +
    `<span class="slide-badge slide-badge-grammar">${escapeHtml(slide.badge || "Grammar")}</span>` +
    `<h2 class="oral-title">${escapeHtml(slide.title || "Grammar Form Practice")}</h2>` +
    `<div class="oral-list">` +
    itemsHtml +
    `</div></div></section>`
  );
}

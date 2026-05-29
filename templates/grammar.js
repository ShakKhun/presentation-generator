/**
 * Grammar slide — rule, formula, examples (Duolingo-style card).
 *
 * JSON:
 * {
 *   "type": "grammar",
 *   "badge": "Grammar",
 *   "title": "Present Perfect",
 *   "subtitle": "Настоящее совершённое время",
 *   "formula": "have / has + past participle",
 *   "explanation": "Main rule in plain English…",
 *   "bullets": ["Point one", "Point two"],
 *   "examples": [
 *     { "en": "She has lived here since 2019.", "ru": "Она живёт здесь с 2019 года." }
 *   ],
 *   "tip": "Optional study tip"
 * }
 */

import { escapeHtml } from "../js/utils.js";

export function renderGrammarExample(example) {
  if (!example) return "";

  return (
    `<li class="grammar-example duo-card-soft">` +
    `<p class="grammar-example-en">${escapeHtml(example.en || example.english || "")}</p>` +
    (example.ru || example.russian
      ? `<p class="grammar-example-ru">${escapeHtml(example.ru || example.russian)}</p>`
      : "") +
    (example.note
      ? `<p class="grammar-example-note">${escapeHtml(example.note)}</p>`
      : "") +
    `</li>`
  );
}

export function renderGrammarSlide(slide) {
  const bullets = Array.isArray(slide.bullets) ? slide.bullets : [];
  const examples = Array.isArray(slide.examples) ? slide.examples : [];

  const bulletsHtml = bullets.length
    ? `<ul class="grammar-bullets">` +
      bullets
        .map((b) => `<li>${escapeHtml(typeof b === "string" ? b : b.text || "")}</li>`)
        .join("") +
      `</ul>`
    : "";

  const examplesHtml = examples.length
    ? `<div class="grammar-examples-wrap">` +
      `<h4 class="grammar-examples-label">Examples</h4>` +
      `<ul class="grammar-examples">` +
      examples.map(renderGrammarExample).join("") +
      `</ul></div>`
    : "";

  return (
    `<section class="slide-grammar" data-slide-type="grammar">` +
    `<div class="slide-grammar-inner">` +
    (slide.badge
      ? `<span class="slide-badge slide-badge-grammar">${escapeHtml(slide.badge)}</span>`
      : `<span class="slide-badge slide-badge-grammar">Grammar</span>`) +
    `<h2 class="grammar-title">${escapeHtml(slide.title || "Grammar")}</h2>` +
    (slide.subtitle
      ? `<p class="grammar-subtitle">${escapeHtml(slide.subtitle)}</p>`
      : "") +
    (slide.formula
      ? `<div class="grammar-formula duo-card-formula">` +
        `<span class="grammar-formula-label">Formula</span>` +
        `<code class="grammar-formula-text">${escapeHtml(slide.formula)}</code>` +
        `</div>`
      : "") +
    (slide.explanation
      ? `<p class="grammar-explanation">${escapeHtml(slide.explanation)}</p>`
      : "") +
    bulletsHtml +
    examplesHtml +
    (slide.tip
      ? `<aside class="grammar-tip duo-card-tip">` +
        `<span class="grammar-tip-icon" aria-hidden="true">💡</span>` +
        `<p>${escapeHtml(slide.tip)}</p>` +
        `</aside>`
      : "") +
    `</div></section>`
  );
}

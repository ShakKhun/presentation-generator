/**
 * Gap-fill — oral practice: prompt with blanks, answer shown (no typing).
 *
 * {
 *   "type": "gap-fill",
 *   "title": "Answers",
 *   "items": [
 *     { "text": "She ____ yesterday", "hint": "work", "answer": "worked" },
 *     {
 *       "text": "Yesterday I ___ to work and ___ my manager.",
 *       "answers": ["went", "met"]
 *     }
 *   ]
 * }
 */

import { escapeHtml } from "../js/utils.js";

const MAX_GAP_ITEMS = 4;

export function normalizeGapAnswers(item) {
  if (Array.isArray(item.answers)) return item.answers.map(String);
  if (item.answer != null && item.answer !== "") return [String(item.answer)];
  return [""];
}

export function buildFilledSentence(text, answers) {
  const parts = text.split(/_{3,}/);
  let html = "";

  for (let i = 0; i < parts.length; i++) {
    html += `<span class="gap-text">${escapeHtml(parts[i])}</span>`;
    if (i < answers.length) {
      html += `<strong class="gap-answer-inline">${escapeHtml(answers[i])}</strong>`;
    }
  }

  return html;
}

export function renderGapPrompt(text, hints) {
  const parts = text.split(/_{3,}/);
  let html = "";
  let gapIdx = 0;

  for (let p = 0; p < parts.length; p++) {
    html += `<span class="gap-text">${escapeHtml(parts[p])}</span>`;
    const gapsInBetween = p < parts.length - 1;
    if (gapsInBetween) {
      html += `<span class="gap-blank">_____</span>`;
      const hint = hints?.[gapIdx];
      if (hint) {
        html += `<span class="gap-hint">(${escapeHtml(hint)})</span>`;
      }
      gapIdx++;
    }
  }

  return html;
}

export function renderGapFillItem(item, index) {
  const answers = normalizeGapAnswers(item);
  const text = item.text || item.sentence || "";
  const hints = item.hints || (item.hint ? [item.hint] : []);
  const gapCount = (text.match(/_{3,}/g) || []).length;

  if (gapCount > 0 && gapCount !== answers.length) {
    return (
      `<div class="oral-item oral-item-error">` +
      `<p>Item ${index + 1}: gaps (${gapCount}) must match answers (${answers.length}).</p>` +
      `</div>`
    );
  }

  const filled =
    gapCount > 0
      ? buildFilledSentence(text, answers)
      : `<strong class="gap-answer-inline">${escapeHtml(answers[0] || "")}</strong>`;

  return (
    `<div class="oral-item gap-fill-item">` +
    `<p class="oral-item-label">${index + 1}</p>` +
    `<div class="gap-prompt duo-card-soft">${renderGapPrompt(text, hints)}</div>` +
    `<div class="gap-answer-reveal duo-card-answer">` +
    `<span class="answer-icon" aria-hidden="true">✓</span>` +
    `<span class="gap-answer-text">${filled}</span>` +
    `</div></div>`
  );
}

export function renderGapFillSlide(slide) {
  const items = Array.isArray(slide.items)
    ? slide.items.slice(0, MAX_GAP_ITEMS)
    : [];

  return (
    `<section class="slide-oral slide-gap-fill" data-slide-type="gap-fill">` +
    `<div class="slide-oral-inner">` +
    (slide.badge
      ? `<span class="slide-badge slide-badge-oral">${escapeHtml(slide.badge)}</span>`
      : `<span class="slide-badge slide-badge-oral">Practice</span>`) +
    `<h2 class="oral-title">${escapeHtml(slide.title || "Fill in the blank")}</h2>` +
    (slide.intro
      ? `<p class="oral-intro">${escapeHtml(slide.intro)}</p>`
      : "") +
    `<div class="oral-list">` +
    items.map(renderGapFillItem).join("") +
    `</div></div></section>`
  );
}

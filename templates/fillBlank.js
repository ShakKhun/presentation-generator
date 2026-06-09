/**
 * Shared fill-in-the-blank helpers.
 */

import { escapeHtml } from "../js/utils.js";
import { playSuccessSound } from "../js/quizInteractions.js";

export function toggleBookAnswers(rootEl) {
  const panel = rootEl.querySelector(".book-answers");
  const btn = rootEl.querySelector(".book-toggle-btn");
  if (!panel) return;

  const isHidden = panel.hidden;
  panel.hidden = !isHidden;

  if (btn) {
    btn.textContent = isHidden ? "Hide answers" : "Show answers";
    btn.setAttribute("aria-expanded", String(isHidden));
    if (isHidden) {
      try { playSuccessSound(); } catch (_) {}
    }
  }
}

export function renderBlankPrompt(text) {
  const parts = String(text).split(/_{3,}/);
  let html = "";
  for (let i = 0; i < parts.length; i++) {
    html += `<span class="gap-text">${escapeHtml(parts[i])}</span>`;
    if (i < parts.length - 1) {
      html += `<span class="gap-blank">_____</span>`;
    }
  }
  return html;
}

export function renderBlankAnswer(text, answer) {
  const parts = String(text).split(/_{3,}/);
  let html = "";
  for (let i = 0; i < parts.length; i++) {
    html += `<span class="gap-text">${escapeHtml(parts[i])}</span>`;
    if (i < parts.length - 1) {
      html += `<strong class="gap-answer-inline">${escapeHtml(answer)}</strong>`;
    }
  }
  return html;
}

export function renderBlankItem(item, index, showAnswer = false) {
  const text = item.text || item.sentence || "";
  const answer = item.answer || "";

  const answered = renderBlankAnswer(text, answer);

  return (
    `<div class="oral-item blank-item">` +
    `<p class="oral-item-label">${index + 1}</p>` +
    `<div class="gap-prompt duo-card-soft">${renderBlankPrompt(text)}</div>` +
    `<button type="button" class="oral-answer-btn"${showAnswer ? " hidden" : ""}>Show answer</button>` +
    `<div class="gap-answer-reveal duo-card-answer"${showAnswer ? "" : " hidden"}>` +
    `<span class="answer-icon" aria-hidden="true">✓</span>` +
    `<span class="gap-answer-text">${answered}</span>` +
    `</div></div>`
  );
}

export function renderFillBlankSlide({
  title = "Exercise",
  badgeClass = "slide-badge-oral",
  badgeText = "Exercise",
  extraClass = "",
  items = [],
  maxItems = 10,
  showAnswers = false,
}) {
  const capped = Array.isArray(items) ? items.slice(0, maxItems) : [];

  return (
    `<section class="slide-oral ${extraClass}" data-slide-type="${extraClass.replace("slide-", "")}">` +
    `<div class="slide-oral-inner">` +
    `<span class="slide-badge ${badgeClass}">${escapeHtml(badgeText)}</span>` +
    `<h2 class="oral-title">${escapeHtml(title)}</h2>` +
    `<div class="oral-list">` +
    capped.map((item, i) => renderBlankItem(item, i, showAnswers)).join("") +
    `</div></div></section>`
  );
}

/**
 * Multiple choice — up to 4 questions per slide.
 *
 * {
 *   "type": "multiple-choice",
 *   "title": "Choose the answer",
 *   "questions": [
 *     {
 *       "prompt": "She ___ yesterday.",
 *       "options": ["worked", "works", "working", "work"],
 *       "answer": 0
 *     }
 *   ]
 * }
 */

import { escapeHtml } from "../js/utils.js";

const MAX_MC_QUESTIONS = 4;

export function renderMcQuestion(question, qIndex) {
  const options = Array.isArray(question.options)
    ? question.options.slice(0, 6)
    : [];
  const correctIndex =
    typeof question.answer === "number"
      ? question.answer
      : typeof question.correct === "number"
        ? question.correct
        : 0;

  const optionsHtml = options
    .map(
      (opt, i) =>
        `<button type="button" class="mc-option duo-card-soft" data-option-index="${i}">` +
        `${escapeHtml(opt)}</button>`
    )
    .join("");

  return (
    `<div class="quiz-item mc-item" data-quiz="multiple-choice" data-correct="${correctIndex}">` +
    `<p class="mc-prompt"><span class="mc-number">${qIndex + 1}.</span> ${escapeHtml(question.prompt || "")}</p>` +
    `<div class="mc-options" role="group" aria-label="Question ${qIndex + 1}">` +
    optionsHtml +
    `</div>` +
    `<button type="button" class="quiz-check-btn">Check</button>` +
    `<p class="quiz-feedback" hidden></p>` +
    `</div>`
  );
}

export function renderMultipleChoiceSlide(slide) {
  const questions = Array.isArray(slide.questions)
    ? slide.questions.slice(0, MAX_MC_QUESTIONS)
    : [];

  return (
    `<section class="slide-quiz slide-mc" data-slide-type="multiple-choice">` +
    `<div class="slide-quiz-inner">` +
    (slide.badge
      ? `<span class="slide-badge slide-badge-quiz">${escapeHtml(slide.badge)}</span>`
      : `<span class="slide-badge slide-badge-quiz">Quiz</span>`) +
    `<h2 class="quiz-title">${escapeHtml(slide.title || "Multiple choice")}</h2>` +
    (slide.intro
      ? `<p class="quiz-intro">${escapeHtml(slide.intro)}</p>`
      : "") +
    `<div class="quiz-list">` +
    questions.map(renderMcQuestion).join("") +
    `</div></div></section>`
  );
}

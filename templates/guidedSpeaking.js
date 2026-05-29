/**
 * Guided speaking — oral prompts for pair / class discussion.
 *
 * {
 *   "type": "guided-speaking",
 *   "title": "Let's speak",
 *   "duration": "2–3 min",
 *   "prompts": [
 *     "Describe your routine using Present Perfect.",
 *     "What tools do you use for work?"
 *   ],
 *   "tips": ["Take turns", "Use today's vocabulary"]
 * }
 */

import { escapeHtml } from "../js/utils.js";

const MAX_SPEAKING_PROMPTS = 6;

export function renderSpeakingPrompt(text, index) {
  return (
    `<li class="speaking-prompt duo-card-soft">` +
    `<span class="speaking-num">${index + 1}</span>` +
    `<p>${escapeHtml(text)}</p>` +
    `</li>`
  );
}

export function renderGuidedSpeakingSlide(slide) {
  const prompts = Array.isArray(slide.prompts)
    ? slide.prompts.slice(0, MAX_SPEAKING_PROMPTS)
    : Array.isArray(slide.questions)
      ? slide.questions.slice(0, MAX_SPEAKING_PROMPTS)
      : [];

  const tips = Array.isArray(slide.tips) ? slide.tips : [];

  const tipsHtml = tips.length
    ? `<ul class="speaking-tips">` +
      tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("") +
      `</ul>`
    : "";

  return (
    `<section class="slide-speaking" data-slide-type="guided-speaking">` +
    `<div class="slide-speaking-inner">` +
    (slide.badge
      ? `<span class="slide-badge slide-badge-speaking">${escapeHtml(slide.badge)}</span>`
      : `<span class="slide-badge slide-badge-speaking">Speaking</span>`) +
  (slide.duration
    ? `<span class="speaking-duration">${escapeHtml(slide.duration)}</span>`
    : "") +
    `<h2 class="speaking-title">${escapeHtml(slide.title || "Guided speaking")}</h2>` +
    (slide.intro
      ? `<p class="speaking-intro">${escapeHtml(slide.intro)}</p>`
      : "") +
    `<ol class="speaking-prompts">` +
    prompts
      .map((p, i) =>
        renderSpeakingPrompt(typeof p === "string" ? p : p.text || "", i)
      )
      .join("") +
    `</ol>` +
    tipsHtml +
    `</div></section>`
  );
}

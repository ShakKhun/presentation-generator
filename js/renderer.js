/**
 * Shared rendering pipeline for preview and export.
 *
 * generatePresentationHTML(lessonData, assets) is the single source of truth
 * used by both the live preview host and the offline presentation.html export.
 */

import { slideRegistry, renderUnknownSlide } from "./registry.js";
import {
  resolveTheme,
  escapeHtml,
  applyTheme,
  WORD_BANK_SIZE,
  DEFAULT_THEME,
  THEMES,
} from "./utils.js";
import { renderTitleSlide } from "../templates/title.js";
import {
  renderWordBankSlide,
  renderVocabCard,
} from "../templates/wordBank.js";
import { renderReadingSlide, renderReadingBlock } from "../templates/reading.js";
import {
  renderGrammarSlide,
  renderGrammarExample,
} from "../templates/grammar.js";
import { applyHighlights, escapeRegExp } from "./utils.js";
import { getLessonTitle } from "./lessonMeta.js";
import {
  renderGapFillSlide,
  renderGapFillItem,
  normalizeGapAnswers,
  buildFilledSentence,
  renderGapPrompt,
} from "../templates/gapFill.js";
import {
  renderMultipleChoiceSlide,
  renderMcQuestion,
} from "../templates/multipleChoice.js";
import {
  renderErrorCorrectionSlide,
  renderErrorCorrectionItem,
} from "../templates/errorCorrection.js";
import {
  renderGuidedSpeakingSlide,
  renderSpeakingPrompt,
} from "../templates/guidedSpeaking.js";
import {
  renderListSlide,
  renderListItem,
  normalizeListItem,
  getListMarker,
  resolveListStyle,
} from "../templates/listSlide.js";
import {
  bindQuizInteractions,
  showQuizFeedback,
  selectMcOption,
  checkMcItem,
  handleQuizCheck,
  revealOralAnswer,
} from "./quizInteractions.js";

export const REVEAL_OPTIONS = {
  hash: true,
  controls: false,
  progress: false,
  center: true,
  disableLayout: true,
  touch: true,
  keyboard: true,
  transition: "slide",
  transitionSpeed: "default",
  backgroundTransition: "fade",
  width: 1280,
  height: 720,
  margin: 0.08,
  minScale: 0.2,
  maxScale: 2.0,
};

export const PREVIEW_REVEAL_OPTIONS = {
  ...REVEAL_OPTIONS,
  embedded: true,
  keyboardCondition: "focused",
};

export function updateDeckProgress(rootEl, revealInstance) {
  const progressEl = rootEl.querySelector(".deck-progress");
  if (!progressEl) return;

  const textEl = progressEl.querySelector(".deck-progress-text");
  const dotsEl = progressEl.querySelector(".deck-progress-dots");
  let total = rootEl.querySelectorAll(".slides > section").length;
  let current = 1;
  let verticalIndex = 0;
  let verticalTotal = 0;

  try {
    if (typeof revealInstance?.getHorizontalSlides === "function") {
      total = revealInstance.getHorizontalSlides().length;
    }
    if (typeof revealInstance?.getIndices === "function") {
      const indices = revealInstance.getIndices();
      current = (indices.h || 0) + 1;
      verticalIndex = indices.v || 0;

      const stack = rootEl.querySelectorAll(".slides > section")[indices.h || 0];
      verticalTotal = stack ? stack.querySelectorAll(":scope > section").length : 0;
    }
  } catch {
    /* Reveal may not have finished its first layout yet. */
  }

  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 1), safeTotal);
  const isHiddenSlide = verticalIndex > 0;

  if (textEl) {
    textEl.textContent = isHiddenSlide
      ? `Extra ${verticalIndex} of ${Math.max(verticalTotal - 1, 1)}`
      : `Slide ${safeCurrent} of ${safeTotal}`;
  }
  if (dotsEl) {
    dotsEl.innerHTML = Array.from({ length: safeTotal }, (_, i) => {
      const slideNumber = i + 1;
      const isActive = slideNumber === safeCurrent;
      return `<span class="deck-progress-dot${isActive ? " is-active" : ""}" aria-label="Slide ${slideNumber}${isActive ? ", current" : ""}"></span>`;
    }).join("");
  }
  progressEl.setAttribute("aria-label", `Presentation progress: slide ${safeCurrent} of ${safeTotal}`);
}

export function bindDeckProgress(rootEl, revealInstance) {
  updateDeckProgress(rootEl, revealInstance);
  revealInstance.on("ready", () => updateDeckProgress(rootEl, revealInstance));
  revealInstance.on("slidechanged", () => updateDeckProgress(rootEl, revealInstance));
}

export function renderSlide(slide, index) {
  const render = slideRegistry[slide.type];
  if (render) return render(slide, index);
  return renderUnknownSlide(slide, index);
}

export function getHiddenSlides(slide) {
  const hiddenSlides = slide?.hiddenSlides || slide?.bonusSlides || slide?.extraSlides;
  return Array.isArray(hiddenSlides) ? hiddenSlides : [];
}

export function renderSlideStack(slide, index) {
  const hiddenSlides = getHiddenSlides(slide);
  if (!hiddenSlides.length) return renderSlide(slide, index);

  return (
    `<section class="hidden-slide-stack" data-hidden-slides="${hiddenSlides.length}">` +
    renderSlide(slide, index) +
    hiddenSlides.map((hiddenSlide, i) => renderSlide(hiddenSlide, `${index}.${i + 1}`)).join("\n") +
    `</section>`
  );
}

export function renderSlides(slides) {
  if (!Array.isArray(slides)) return "";
  return slides.map((slide, i) => renderSlideStack(slide, i)).join("\n");
}

const MOBILE_STATIC_ANSWER_TYPES = new Set([
  "gap-fill",
  "multiple-choice",
  "error-correction",
]);

function addClassToSection(html, className) {
  return String(html).replace("<section class=\"", `<section class="${className} `);
}

function renderMobileStaticAnswerSlide(slide) {
  if (!MOBILE_STATIC_ANSWER_TYPES.has(slide?.type)) return "";

  const answerSlide = {
    ...slide,
    title: `${slide.title || "Answers"} · Answers`,
  };

  let html = "";
  if (slide.type === "gap-fill") {
    html = renderGapFillSlide(answerSlide, null, true);
  } else if (slide.type === "multiple-choice") {
    html = renderMultipleChoiceSlide(answerSlide, null, true);
  } else if (slide.type === "error-correction") {
    html = renderErrorCorrectionSlide(answerSlide, null, true);
  }

  return addClassToSection(html, "mobile-answer-slide");
}

function renderMobileStaticSlideGroup(slide, index) {
  return renderSlide(slide, index) + renderMobileStaticAnswerSlide(slide);
}

function renderMobileStaticSlideStack(slide, index) {
  const hiddenSlides = getHiddenSlides(slide);
  if (!hiddenSlides.length) return renderMobileStaticSlideGroup(slide, index);

  return (
    `<section class="hidden-slide-stack" data-hidden-slides="${hiddenSlides.length}">` +
    renderMobileStaticSlideGroup(slide, index) +
    hiddenSlides
      .map((hiddenSlide, i) => renderMobileStaticSlideGroup(hiddenSlide, `${index}.${i + 1}`))
      .join("\n") +
    `</section>`
  );
}

export function renderMobileStaticSlides(slides) {
  if (!Array.isArray(slides)) return "";
  return slides.map((slide, i) => renderMobileStaticSlideStack(slide, i)).join("\n");
}

export function renderProgressDots(total) {
  const count = Math.max(Number(total) || 1, 1);
  return Array.from({ length: count }, (_, i) => {
    const slideNumber = i + 1;
    return `<span class="deck-progress-dot${i === 0 ? " is-active" : ""}" aria-label="Slide ${slideNumber}${i === 0 ? ", current" : ""}"></span>`;
  }).join("");
}

/**
 * Deck markup only (used inside preview host).
 */
export function renderDeckMarkup(lesson, themeOverride) {
  const theme = resolveTheme(lesson, themeOverride);
  const slidesHtml = renderSlides(lesson.slides);
  const slideCount = Array.isArray(lesson.slides) ? lesson.slides.length : 1;

  return (
    `<div class="lesson-deck" data-theme="${escapeHtml(theme)}">` +
    `<div class="deck-stage">` +
    `<div class="reveal">` +
    `<div class="slides">${slidesHtml}</div>` +
    `</div>` +
    `</div>` +
    `<div class="deck-progress" role="status" aria-live="polite">` +
    `<span class="deck-progress-dots" aria-hidden="true">${renderProgressDots(slideCount)}</span>` +
    `<span class="deck-progress-text">Slide 1 of ${slideCount}</span>` +
    `</div>` +
    `</div>`
  );
}

/**
 * Flip cards via event delegation (no inline handlers).
 */
export function bindDeckInteractions(rootEl) {
  rootEl.addEventListener("click", (e) => {
    const card = e.target.closest(".vocab-card:not(.empty)");
    if (!card || !rootEl.contains(card)) return;
    e.stopPropagation();
    const flipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", flipped ? "true" : "false");
  });

  bindQuizInteractions(rootEl);
}

/** Prevent inline script from breaking out of <script> tags in exported HTML. */
function escapeScriptForHtml(code) {
  return String(code).replace(/<\/script/gi, "<\\/script");
}

/** Strip ES module syntax so functions can run inside a plain <script> tag. */
function inlineFunction(fn) {
  return fn.toString().replace(/^export\s+/, "");
}

/**
 * Builds the standalone runtime script inlined into presentation.html.
 * Kept in sync with module implementations (registry + templates + utils).
 */
export function buildStandaloneRuntimeScript() {
  const fns = [
    `var WORD_BANK_SIZE = ${WORD_BANK_SIZE};`,
    "var MAX_GAP_ITEMS = 4;",
    "var MAX_MC_QUESTIONS = 4;",
    "var MAX_ERROR_ITEMS = 4;",
    "var MAX_SPEAKING_PROMPTS = 6;",
    "var MAX_LIST_ITEMS = 12;",
    "var LIST_LETTERS = \"abcdefghijklmnopqrstuvwxyz\";",
    `var DEFAULT_THEME = ${JSON.stringify(DEFAULT_THEME)};`,
    `var THEMES = ${JSON.stringify(THEMES)};`,
    inlineFunction(escapeHtml),
    inlineFunction(escapeRegExp),
    inlineFunction(resolveTheme),
    inlineFunction(applyTheme),
    inlineFunction(renderTitleSlide),
    inlineFunction(renderVocabCard),
    inlineFunction(renderWordBankSlide),
    inlineFunction(applyHighlights),
    inlineFunction(renderReadingBlock),
    inlineFunction(renderReadingSlide),
    inlineFunction(renderGrammarExample),
    inlineFunction(renderGrammarSlide),
    inlineFunction(normalizeGapAnswers),
    inlineFunction(buildFilledSentence),
    inlineFunction(renderGapPrompt),
    inlineFunction(renderGapFillItem),
    inlineFunction(renderGapFillSlide),
    inlineFunction(renderMcQuestion),
    inlineFunction(renderMultipleChoiceSlide),
    inlineFunction(renderErrorCorrectionItem),
    inlineFunction(renderErrorCorrectionSlide),
    inlineFunction(renderSpeakingPrompt),
    inlineFunction(renderGuidedSpeakingSlide),
    inlineFunction(normalizeListItem),
    inlineFunction(getListMarker),
    inlineFunction(resolveListStyle),
    inlineFunction(renderListItem),
    inlineFunction(renderListSlide),
    inlineFunction(renderUnknownSlide),
    inlineFunction(getLessonTitle),
    inlineFunction(showQuizFeedback),
    inlineFunction(selectMcOption),
    inlineFunction(checkMcItem),
    inlineFunction(handleQuizCheck),
    inlineFunction(revealOralAnswer),
    inlineFunction(bindQuizInteractions),
    `var slideRegistry = {
  title: renderTitleSlide,
  "word-bank": renderWordBankSlide,
  reading: renderReadingSlide,
  grammar: renderGrammarSlide,
  "gap-fill": renderGapFillSlide,
  "multiple-choice": renderMultipleChoiceSlide,
  "error-correction": renderErrorCorrectionSlide,
  "guided-speaking": renderGuidedSpeakingSlide,
  list: renderListSlide
};`,
    inlineFunction(renderSlide),
    inlineFunction(getHiddenSlides),
    inlineFunction(renderSlideStack),
    inlineFunction(renderSlides),
    inlineFunction(renderProgressDots),
    inlineFunction(updateDeckProgress),
    inlineFunction(bindDeckProgress),
    inlineFunction(renderDeckMarkup),
    `var REVEAL_OPTIONS = ${JSON.stringify(REVEAL_OPTIONS)};`,
    `function bindDeckInteractions(rootEl) {
  rootEl.addEventListener("click", function (e) {
    var card = e.target.closest(".vocab-card:not(.empty)");
    if (!card || !rootEl.contains(card)) return;
    e.stopPropagation();
    var flipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", flipped ? "true" : "false");
  });
  bindQuizInteractions(rootEl);
}`,
    `function bootLesson(lesson) {
  var root = document.getElementById("lesson-root");
  try {
    document.documentElement.classList.add("presentation-enhanced");
    document.body.classList.add("presentation-enhanced");
    root.classList.add("is-enhanced");
    root.innerHTML = renderDeckMarkup(lesson);
    var deck = root.querySelector(".lesson-deck");
    bindDeckInteractions(deck);
    var revealEl = deck.querySelector(".reveal");
    var instance = new Reveal(revealEl, REVEAL_OPTIONS);
    bindDeckProgress(deck, instance);
    instance.initialize();
  } catch (err) {
    root.innerHTML = "<pre style=\\"padding:2rem;color:#b91c1c;\\">" + err.message + "</pre>";
    console.error(err);
  }
}`,
  ];
  return fns.join("\n\n");
}

/**
 * Full offline HTML document — preview export and download use this.
 *
 * @param {object} lessonData - Parsed lesson JSON
 * @param {object} assets - Inlined vendor + app assets
 * @param {string} assets.resetCss
 * @param {string} assets.revealCss
 * @param {string} assets.revealJs
 * @param {string} assets.lessonCss - base + themes + slides
 * @param {string} assets.runtimeJs - standalone boot script
 */
export function generatePresentationHTML(lessonData, assets) {
  const title = getLessonTitle(lessonData);
  const lessonJson = JSON.stringify(lessonData).replace(/</g, "\\u003c");
  const staticTheme = resolveTheme(lessonData);
  const staticSlidesHtml = renderMobileStaticSlides(lessonData.slides);

  return (
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
${assets.resetCss}
${assets.revealCss}
${assets.lessonCss}
html, body { margin: 0; min-height: 100%; background: var(--deck-shell, #ede8df); }
html.presentation-enhanced, body.presentation-enhanced { height: 100%; overflow: hidden; }
#lesson-root { width: 100vw; min-height: 100vh; position: relative; background: var(--deck-shell, #ede8df); }
#lesson-root.is-enhanced { height: 100vh; overflow: hidden; }
#lesson-root.is-enhanced .lesson-deck { position: absolute; inset: 0; width: 100%; height: 100%; }
.presentation-loading {
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  box-sizing: border-box;
  color: #1a2b3c;
  font: 600 1rem/1.5 "Segoe UI", system-ui, sans-serif;
  text-align: center;
}
.presentation-loading p {
  max-width: 30rem;
  margin: 0;
}
.mobile-static-deck {
  display: none;
}
@media (max-width: 760px), (max-height: 520px) {
  #lesson-root:not(.is-enhanced) {
    width: 100%;
    min-height: 100vh;
    overflow: visible;
  }

  #lesson-root:not(.is-enhanced) .presentation-loading {
    display: none;
  }

  #lesson-root:not(.is-enhanced) .mobile-static-deck {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    min-height: 100vh;
    padding: 0.55rem;
    box-sizing: border-box;
    background: var(--deck-shell, #ede8df);
  }

  #lesson-root:not(.is-enhanced) .mobile-static-deck > section.hidden-slide-stack {
    display: contents !important;
  }

  #lesson-root:not(.is-enhanced) .mobile-static-deck section {
    width: 100%;
    min-height: calc(100dvh - 1.1rem);
    box-sizing: border-box;
    border-radius: 14px;
    background: var(--bg);
    box-shadow: 0 10px 24px rgba(26, 43, 60, 0.12);
    overflow: hidden;
  }

  #lesson-root:not(.is-enhanced) .mobile-static-deck .vocab-card {
    cursor: default;
    pointer-events: none;
  }

  #lesson-root:not(.is-enhanced) .mobile-static-deck .oral-answer-btn,
  #lesson-root:not(.is-enhanced) .mobile-static-deck .quiz-check-btn {
    display: none;
  }

  #lesson-root:not(.is-enhanced) .mobile-static-deck .vocab-card-inner {
    min-height: 0;
    transform: none;
  }

  #lesson-root:not(.is-enhanced) .mobile-static-deck .vocab-card-face.front {
    display: none;
  }

  #lesson-root:not(.is-enhanced) .mobile-static-deck .vocab-card-face.back {
    position: static;
    transform: none;
    min-height: 100%;
  }
}
  </style>
</head>
<body>
  <div id="lesson-root">
    <div class="presentation-loading">
      <p>Loading presentation... If this message stays visible, open the file in Safari from a web link or local server. Some iPhone file previews block presentation scripts.</p>
    </div>
    <noscript>
      <div class="presentation-loading">
        <p>JavaScript is required to show this presentation.</p>
      </div>
    </noscript>
    <div class="lesson-deck mobile-static-deck" data-theme="${escapeHtml(staticTheme)}" aria-label="Mobile presentation preview">
${staticSlidesHtml}
    </div>
  </div>
  <script>
${escapeScriptForHtml(assets.revealJs)}
  <\/script>
  <script>
${escapeScriptForHtml(assets.runtimeJs)}
var LESSON = ${lessonJson};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () { bootLesson(LESSON); });
} else {
  bootLesson(LESSON);
}
  <\/script>
</body>
</html>`
  );
}

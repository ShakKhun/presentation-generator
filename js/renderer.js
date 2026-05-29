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
} from "./quizInteractions.js";

export const REVEAL_OPTIONS = {
  hash: true,
  controls: true,
  progress: true,
  center: true,
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

export function renderSlide(slide, index) {
  const render = slideRegistry[slide.type];
  if (render) return render(slide, index);
  return renderUnknownSlide(slide, index);
}

export function renderSlides(slides) {
  if (!Array.isArray(slides)) return "";
  return slides.map((slide, i) => renderSlide(slide, i)).join("\n");
}

/**
 * Deck markup only (used inside preview host).
 */
export function renderDeckMarkup(lesson, themeOverride) {
  const theme = resolveTheme(lesson, themeOverride);
  const slidesHtml = renderSlides(lesson.slides);

  return (
    `<div class="lesson-deck" data-theme="${escapeHtml(theme)}">` +
    `<div class="reveal">` +
    `<div class="slides">${slidesHtml}</div>` +
    `</div></div>`
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
    inlineFunction(renderSlides),
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
    root.innerHTML = renderDeckMarkup(lesson);
    var deck = root.querySelector(".lesson-deck");
    bindDeckInteractions(deck);
    var revealEl = deck.querySelector(".reveal");
    var instance = new Reveal(revealEl, REVEAL_OPTIONS);
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
html, body { margin: 0; height: 100%; overflow: hidden; }
#lesson-root { width: 100vw; height: 100vh; position: relative; }
#lesson-root .lesson-deck,
#lesson-root .lesson-deck .reveal { position: absolute; inset: 0; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="lesson-root"></div>
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

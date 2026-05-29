/**
 * Slide type registry — extension point for new slide types.
 *
 * To add a slide type (quiz, reading, discussion, etc.):
 * 1. Create templates/mySlide.js with export function renderMySlide(slide)
 * 2. Import and register it in slideRegistry below
 * 3. Add styles in css/slides.css
 * 4. Extend bindDeckInteractions() in renderer.js if the slide needs JS behavior
 */

import { renderTitleSlide } from "../templates/title.js";
import { renderWordBankSlide } from "../templates/wordBank.js";
import { renderReadingSlide } from "../templates/reading.js";
import { renderGrammarSlide } from "../templates/grammar.js";
import { renderGapFillSlide } from "../templates/gapFill.js";
import { renderMultipleChoiceSlide } from "../templates/multipleChoice.js";
import { renderErrorCorrectionSlide } from "../templates/errorCorrection.js";
import { renderGuidedSpeakingSlide } from "../templates/guidedSpeaking.js";
import { renderListSlide } from "../templates/listSlide.js";
import { escapeHtml } from "./utils.js";

export const slideRegistry = {
  title: renderTitleSlide,
  "word-bank": renderWordBankSlide,
  reading: renderReadingSlide,
  grammar: renderGrammarSlide,
  "gap-fill": renderGapFillSlide,
  "multiple-choice": renderMultipleChoiceSlide,
  "error-correction": renderErrorCorrectionSlide,
  "guided-speaking": renderGuidedSpeakingSlide,
  list: renderListSlide,
};

export function renderUnknownSlide(slide, index) {
  return (
    `<section class="slide-unknown">` +
    `<p>Unknown slide type: <strong>${escapeHtml(slide.type)}</strong> (index ${index})</p>` +
    `<p>Register a renderer in <code>js/registry.js</code> to support this type.</p>` +
    `</section>`
  );
}

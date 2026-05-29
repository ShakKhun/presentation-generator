/**
 * Word-bank slide template — six flip vocabulary cards.
 */

import { escapeHtml, WORD_BANK_SIZE } from "../js/utils.js";

export function renderVocabCard(word, index) {
  if (!word || !word.word) {
    return (
      `<button type="button" class="vocab-card empty" data-card-index="${index}" disabled>` +
      `<div class="vocab-card-inner">` +
      `<div class="vocab-card-face front"><span>—</span></div>` +
      `</div></button>`
    );
  }

  return (
    `<button type="button" class="vocab-card" data-card-index="${index}" aria-pressed="false">` +
    `<div class="vocab-card-inner">` +
    `<div class="vocab-card-face front">` +
    `<p class="word">${escapeHtml(word.word)}</p>` +
    `<p class="pronunciation">${escapeHtml(word.pronunciation || "")}</p>` +
    `</div>` +
    `<div class="vocab-card-face back">` +
    `<p class="translation">${escapeHtml(word.translation || "")}</p>` +
    (word.association
      ? `<p class="association">${escapeHtml(word.association)}</p>`
      : "") +
    (word.example
      ? `<p class="example">${escapeHtml(word.example)}</p>`
      : "") +
    `</div></div></button>`
  );
}

export function renderWordBankSlide(slide) {
  const words = Array.isArray(slide.words)
    ? slide.words.slice(0, WORD_BANK_SIZE)
    : [];
  while (words.length < WORD_BANK_SIZE) {
    words.push(null);
  }

  const cards = words.map((w, i) => renderVocabCard(w, i)).join("");

  return (
    `<section class="slide-word-bank" data-slide-type="word-bank">` +
    `<h2>Vocabulary</h2>` +
    `<div class="word-bank-grid" role="list">` +
    cards +
    `</div></section>`
  );
}

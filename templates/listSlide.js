/**
 * List slide — homework, reminders, overview (flexible markers).
 *
 * {
 *   "type": "list",
 *   "title": "Homework",
 *   "listStyle": "number",
 *   "items": ["Write 5 sentences", "Speak 2 minutes"]
 * }
 *
 * listStyle: "number" | "letter" | "bullet" | "none"
 * Items may be strings or { "text": "...", "icon": "❤️" }
 */

import { escapeHtml } from "../js/utils.js";

const MAX_LIST_ITEMS = 12;
const LIST_LETTERS = "abcdefghijklmnopqrstuvwxyz";

export function normalizeListItem(item) {
  if (typeof item === "string") return { text: item, icon: "" };
  return {
    text: item.text || item.content || "",
    icon: item.icon || item.emoji || "",
  };
}

export function getListMarker(style, index) {
  if (style === "number") return `${index + 1}.`;
  if (style === "letter") return `${LIST_LETTERS[index] || "•"}.`;
  if (style === "bullet") return "•";
  return "";
}

export function renderListItem(item, index, listStyle) {
  const { text, icon } = normalizeListItem(item);
  const marker = getListMarker(listStyle, index);
  const showMarker = listStyle !== "none" && !icon;

  return (
    `<li class="content-list-item duo-card-soft">` +
    (showMarker
      ? `<span class="list-marker">${escapeHtml(marker)}</span>`
      : "") +
    (icon ? `<span class="list-icon">${escapeHtml(icon)}</span>` : "") +
    `<span class="list-text">${escapeHtml(text)}</span>` +
    `</li>`
  );
}

export function resolveListStyle(slide) {
  const style = (slide.listStyle || slide.style || "bullet").toLowerCase();
  if (["number", "numbered", "ordered"].includes(style)) return "number";
  if (["letter", "lettered", "alpha"].includes(style)) return "letter";
  if (["bullet", "bullets", "unordered"].includes(style)) return "bullet";
  if (["none", "plain"].includes(style)) return "none";
  return "bullet";
}

export function renderListSlide(slide) {
  const items = Array.isArray(slide.items) ? slide.items.slice(0, MAX_LIST_ITEMS) : [];
  const listStyle = resolveListStyle(slide);
  const listTag = listStyle === "number" || listStyle === "letter" ? "ol" : "ul";

  return (
    `<section class="slide-list" data-slide-type="list">` +
    `<div class="slide-list-inner duo-card">` +
    (slide.badge
      ? `<span class="slide-badge slide-badge-list">${escapeHtml(slide.badge)}</span>`
      : "") +
    `<h2 class="list-slide-title">${escapeHtml(slide.title || "Notes")}</h2>` +
    (slide.intro
      ? `<p class="list-slide-intro">${escapeHtml(slide.intro)}</p>`
      : "") +
    `<${listTag} class="content-list content-list-${listStyle}">` +
    items.map((item, i) => renderListItem(item, i, listStyle)).join("") +
    `</${listTag}>` +
    `</div></section>`
  );
}

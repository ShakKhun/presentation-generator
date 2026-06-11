/**
 * AI Lesson Studio — main application entry.
 */

import Reveal from "../vendor/reveal/reveal.esm.js";
import { parseLessonJson } from "./utils.js";
import {
  renderDeckMarkup,
  bindDeckInteractions,
  bindDeckProgress,
  PREVIEW_REVEAL_OPTIONS,
} from "./renderer.js";
import { preloadExportAssets, downloadPresentation } from "./exporter.js";
import { getLessonTitle } from "./lessonMeta.js";

const MONACO_VS = "vendor/monaco/min/vs";

let slidesEditor = null;
let hiddenSlidesEditor = null;
let previewReveal = null;
let previewDeckRoot = null;

const themeSelect = document.getElementById("theme-select");
const previewHost = document.getElementById("preview-host");
const statusEl = document.getElementById("status-message");

function setStatus(message, isOk = false) {
  statusEl.textContent = message || "";
  statusEl.classList.toggle("is-ok", Boolean(isOk));
}

function getThemeOverride() {
  return themeSelect.value || null;
}

function destroyPreviewReveal() {
  if (previewReveal) {
    previewReveal.destroy();
    previewReveal = null;
  }
}

function mountPreview(lesson) {
  destroyPreviewReveal();

  previewHost.innerHTML = renderDeckMarkup(lesson, getThemeOverride());
  previewDeckRoot = previewHost.querySelector(".lesson-deck");
  bindDeckInteractions(previewDeckRoot);

  const revealEl = previewDeckRoot.querySelector(".reveal");
  previewReveal = new Reveal(revealEl, PREVIEW_REVEAL_OPTIONS);
  bindDeckProgress(previewDeckRoot, previewReveal);
  document.title = getLessonTitle(lesson) + " — AI Lesson Studio";

  previewReveal.initialize().then(() => {
    previewReveal.layout();
  });

  if (!window.__previewResizeBound) {
    window.__previewResizeBound = true;
    window.addEventListener("resize", () => {
      if (previewReveal) previewReveal.layout();
    });
  }
}

function getHiddenSlidesFromJson(text) {
  if (!text || text.trim() === "") return [];
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && data.type) return [data];
  } catch {
    // Not valid JSON
  }
  return [];
}

function getLessonFromEditor() {
  const slidesText = slidesEditor?.getValue() || "[]";
  const hiddenText = hiddenSlidesEditor?.getValue() || "";

  let lesson = parseLessonJson(slidesText);

  if (hiddenText && hiddenText.trim() !== "") {
    const hiddenSlides = getHiddenSlidesFromJson(hiddenText);
    if (hiddenSlides.length > 0) {
      const slides = [...lesson.slides];
      const lastListIndex = slides.map((s, i) => ({ slide: s, index: i }))
        .filter(({ slide }) => slide.type === "list" && !slide.hiddenSlides)
        .pop()?.index;
      if (lastListIndex !== undefined) {
        slides[lastListIndex] = { ...slides[lastListIndex], hiddenSlides };
      }
      lesson = { ...lesson, slides };
    }
  }

  return lesson;
}

function runPreview() {
  try {
    const lesson = getLessonFromEditor();
    mountPreview(lesson);
    setStatus("Preview updated.", true);
  } catch (err) {
    setStatus(err.message || String(err));
  }
}

async function runDownload() {
  try {
    const rawMainSlides = slidesEditor?.getValue() || "[]";
    const rawHiddenSlides = hiddenSlidesEditor?.getValue() || "";
    const lesson = getLessonFromEditor();
    const override = getThemeOverride();
    const exportLesson = override
      ? { ...lesson, theme: override }
      : lesson;
    exportLesson._mainSlides = rawMainSlides;
    exportLesson._hiddenSlides = rawHiddenSlides;

    if (!window.__exportAssetsReady) {
      setStatus("Loading export assets…");
      await preloadExportAssets();
      window.__exportAssetsReady = true;
    }

    await downloadPresentation(exportLesson);
    setStatus("Downloaded presentation.html (fully offline).", true);
  } catch (err) {
    setStatus(
      (err.message || String(err)) +
        " — Open this app via a local server (e.g. npx serve) if files fail to load."
    );
  }
}

function formatCurrentTab() {
  const activeTab = document.querySelector(".panel-tab.active");
  if (!activeTab) return;
  const tab = activeTab.dataset.tab;
  const editor = tab === "slides" ? slidesEditor : hiddenSlidesEditor;
  if (!editor) return;
  try {
    const parsed = JSON.parse(editor.getValue());
    const formatted = Array.isArray(parsed) ? parsed : parsed?.type ? [parsed] : parsed;
    editor.setValue(JSON.stringify(formatted, null, 2));
    setStatus(`${tab === "slides" ? "Slides" : "Hidden"} JSON formatted.`, true);
  } catch (err) {
    setStatus(err.message || String(err));
  }
}

function switchTab(tabName) {
  document.querySelectorAll(".panel-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.getElementById("monaco-editor").classList.toggle("hidden", tabName !== "slides");
  document.getElementById("monaco-hidden-slides").classList.toggle("visible", tabName === "hidden");
}

const PROMPT_TEXT = `LESSON JSON FORMAT

Generate a JSON array of slide objects.

Lesson Generation Rules

- All slide types described below are available.
- Not every slide type must be used.
- Any slide type may appear multiple times.
- Use only the slides that improve the lesson.
- Arrange slides in the most logical teaching order.
- Include only fields that belong to the selected slide type.
- Output valid JSON only.

Available slide types:

{
"type": "title",
"title": string,
"subtitle": string
}

{
"type": "word-bank",
"words": [
{
"word": string,
"pronunciation": string,
"translation": string,
"association": string,
"example": string
}
]
}

{
"type": "reading",
"badge": string,
"title": string,
"intro": string,
"blocks": [
{
"type": "heading",
"text": string
},
{
"type": "paragraph",
"text": string,
"highlights": [string]
}
]
}

{
"type": "grammar",
"badge": string,
"title": string,
"subtitle": string,
"formula": string,
"explanation": string,
"bullets": [string],
"examples": [
{
"en": string,
"ru": string
}
],
"tip": string
}

{
"type": "gap-fill",
"badge": string,
"title": string,
"intro": string,
"items": [
{
"text": string,
"hint": string,
"answer": string
},
{
"text": string,
"hints": [string],
"answers": [string]
}
]
}

{
"type": "book-exercise",
"badge": string,
"title": string,
"words": [string],
"items": [
{
"text": string,
"answer": string
}
]
}

{
"type": "multiple-choice",
"badge": string,
"title": string,
"intro": string,
"questions": [
{
"prompt": string,
"options": [string],
"answer": number
}
]
}

{
"type": "error-correction",
"badge": string,
"title": string,
"intro": string,
"items": [
{
"incorrect": string,
"correct": string,
"hint": string
}
]
}

{
"type": "guided-speaking",
"badge": string,
"title": string,
"duration": string,
"intro": string,
"prompts": [string],
"tips": [string]
}

{
"type": "list",
"badge": string,
"title": string,
"listStyle": "bullet | number | letter | none",
"intro": string,
"items": [string | object]
}`;

function copyPrompt() {
  navigator.clipboard.writeText(PROMPT_TEXT).then(() => {
    setStatus("Prompt copied to clipboard.", true);
  }).catch(() => {
    setStatus("Failed to copy prompt.", false);
  });
}

function createEditor(elementId, initialValue) {
  return monaco.editor.create(document.getElementById(elementId), {
    value: initialValue,
    language: "json",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    wordWrap: "on",
    formatOnPaste: true,
    tabSize: 2,
  });
}

function initMonaco() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined") {
      const baseUrl = new URL(MONACO_VS, window.location.href).toString();
      const workerUrl = new URL(MONACO_VS + "/base/worker/workerMain.js", window.location.href).toString();
      window.MonacoEnvironment = {
        baseUrl,
        getWorkerUrl: function () {
          return (
            "data:text/javascript;charset=utf-8," +
            encodeURIComponent(
              "self.MonacoEnvironment = { baseUrl: '" +
                baseUrl +
                "' }; importScripts('" +
                workerUrl +
                "')"
            )
          );
        },
      };
    }

    require.config({ paths: { vs: MONACO_VS } });

    require(["vs/editor/editor.main"], () => {
      slidesEditor = createEditor("monaco-editor", "");

      slidesEditor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        formatCurrentTab
      );

      resolve();
    }, reject);
  });
}

async function loadSampleLesson() {
  try {
    const response = await fetch("data/sampleLesson.json");
    if (!response.ok) throw new Error("fetch failed");
    return await response.text();
  } catch {
    return JSON.stringify(
      [
        {
          type: "title",
          title: "Technology Vocabulary",
          subtitle: "B1 ESL Lesson",
        },
        {
          type: "word-bank",
          words: [
            {
              word: "reliable",
              pronunciation: "ri-LY-uh-buhl",
              translation: "надёжный",
              association: "dependable, trustworthy, consistent, steady",
              example: "She is a reliable employee.",
            },
          ],
        },
      ],
      null,
      2
    );
  }
}

async function bootstrap() {
  try {
    await initMonaco();
    const sample = await loadSampleLesson();
    slidesEditor.setValue(sample);

    hiddenSlidesEditor = createEditor("monaco-hidden-slides", "");

    document.querySelectorAll(".panel-tab").forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.getElementById("btn-preview").addEventListener("click", runPreview);
    document.getElementById("btn-download").addEventListener("click", runDownload);
    document.getElementById("btn-format").addEventListener("click", formatCurrentTab);
    document.getElementById("btn-copy-prompt").addEventListener("click", copyPrompt);
    themeSelect.addEventListener("change", () => {
      if (previewDeckRoot) runPreview();
    });

    preloadExportAssets()
      .then(() => {
        window.__exportAssetsReady = true;
      })
      .catch(() => {
        /* Export assets load on first download attempt */
      });

    runPreview();
  } catch (err) {
    setStatus(
      "Failed to start AI Lesson Studio: " +
        (err.message || String(err))
    );
  }
}

bootstrap();
/**
 * AI Lesson Studio — main application entry.
 */

import Reveal from "../vendor/reveal/reveal.esm.js";
import { parseLessonJson } from "./utils.js";
import {
  renderDeckMarkup,
  bindDeckInteractions,
  PREVIEW_REVEAL_OPTIONS,
} from "./renderer.js";
import { preloadExportAssets, downloadPresentation } from "./exporter.js";
import { getLessonTitle } from "./lessonMeta.js";

const MONACO_VS = "vendor/monaco/min/vs";

let editor = null;
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

function getLessonFromEditor() {
  return parseLessonJson(editor.getValue());
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
    const lesson = getLessonFromEditor();
    const override = getThemeOverride();
    const exportLesson = override
      ? { ...lesson, theme: override }
      : lesson;

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

function formatJson() {
  try {
    const lesson = getLessonFromEditor();
    editor.setValue(JSON.stringify(lesson, null, 2));
    setStatus("JSON formatted.", true);
  } catch (err) {
    setStatus(err.message || String(err));
  }
}

function initMonaco() {
  return new Promise((resolve, reject) => {
    require.config({ paths: { vs: MONACO_VS } });

    require(["vs/editor/editor.main"], () => {
      editor = monaco.editor.create(document.getElementById("monaco-editor"), {
        value: "",
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

      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        formatJson
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
      {
        theme: "light-modern",
        slides: [
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
                pronunciation: "/rɪˈlaɪəbəl/",
                translation: "надежный",
                association: "a friend who always helps",
                example: "She is a reliable employee.",
              },
            ],
          },
        ],
      },
      null,
      2
    );
  }
}

async function bootstrap() {
  try {
    await initMonaco();
    const sample = await loadSampleLesson();
    editor.setValue(sample);

    document.getElementById("btn-preview").addEventListener("click", runPreview);
    document.getElementById("btn-download").addEventListener("click", runDownload);
    document.getElementById("btn-format").addEventListener("click", formatJson);
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

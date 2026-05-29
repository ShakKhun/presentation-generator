/**
 * Export system — loads local vendor assets and produces offline presentation.html.
 */

import { generatePresentationHTML, buildStandaloneRuntimeScript } from "./renderer.js";

let assetCache = null;

/** Project root (parent of js/) — stable paths regardless of page URL */
const PROJECT_ROOT = new URL("../", import.meta.url);

async function fetchText(relativePath) {
  const url = new URL(relativePath, PROJECT_ROOT);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${relativePath} (${response.status})`);
  }
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`File is empty: ${relativePath}`);
  }
  return text;
}

/**
 * Preload vendor + CSS assets for fast export.
 * Call on app startup (requires http:// or local server for fetch).
 */
export async function preloadExportAssets() {
  if (assetCache) return assetCache;

  const [
    resetCss,
    revealCss,
    revealJs,
    baseCss,
    themesCss,
    slidesCss,
  ] = await Promise.all([
    fetchText("vendor/reveal/reset.css"),
    fetchText("vendor/reveal/reveal.css"),
    fetchText("vendor/reveal/reveal.js"),
    fetchText("css/base.css"),
    fetchText("css/themes.css"),
    fetchText("css/slides.css"),
  ]);

  assetCache = {
    resetCss,
    revealCss,
    revealJs,
    lessonCss: `${baseCss}\n${themesCss}\n${slidesCss}`,
    runtimeJs: buildStandaloneRuntimeScript(),
  };

  return assetCache;
}

export function getAssetCache() {
  return assetCache;
}

/**
 * Download a fully standalone presentation.html (no CDN, no external files).
 */
export async function downloadPresentation(lessonData) {
  const assets = assetCache || (await preloadExportAssets());
  const html = generatePresentationHTML(lessonData, assets);

  if (!html || html.length < 5000) {
    throw new Error(
      "Export produced invalid HTML. Check that vendor/reveal files exist."
    );
  }

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "presentation.html";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revoke too early cancels the download in some browsers (empty file).
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

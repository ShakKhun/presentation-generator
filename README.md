# AI Lesson Studio

Local, AI-native ESL / IELTS lesson presentation builder powered by **Reveal.js** and **Monaco Editor**.

## Quick start

1. Open a terminal in the `project` folder.
2. If `vendor/` is missing, run: `npm install reveal.js@5.2.1 monaco-editor@0.52.2 --no-save` then copy `node_modules/reveal.js/dist/*` → `vendor/reveal/` and `node_modules/monaco-editor/min` → `vendor/monaco/min`.
3. Start a local server (required for modules + export asset loading):

```bash
npx --yes serve -p 3000
```

4. Open `http://localhost:3000`

## Workflow

1. Edit lesson JSON in Monaco.
2. **Preview** — live Reveal.js deck on the right.
3. **Download** — saves fully offline `presentation.html` (no CDN; all CSS/JS/data embedded).

## Project layout

| Path | Role |
|------|------|
| `js/registry.js` | Slide type registry (extension point) |
| `templates/` | Per-slide renderers |
| `js/renderer.js` | Shared `generatePresentationHTML()` pipeline |
| `js/exporter.js` | Offline export + asset inlining |
| `css/themes.css` | Theme variables only |
| `data/sampleLesson.json` | Starter lesson |

## Adding slide types

See comments in `js/registry.js` and `js/renderer.js`.

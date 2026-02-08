# MathML Learning Workbench

Single-page web app for exploring MathML authoring, rendering, and accessibility outputs.

## Current Status

M7 is implemented:
- Dual MathML editors (A/B)
- Syntax-highlight preview for each editor
- XML formatting actions (`Format A`, `Format B`)
- Contextual help for valid child tags and attributes based on cursor location
- Warning lists for parse errors, unknown tags, and unknown attributes
- Simultaneous native MathML rendering (A/B)
- Simultaneous MathJax rendering (A/B)
- Runtime MathJax version switching (2.7.9, 3.2.2, 4.0.0)
- Runtime output mode switching (`CHTML` / `SVG`)
- MathJax load-state indicator with error handling
- Accessibility output channels for A/B:
  - MathCAT ClearSpeak
  - MathCAT SimpleSpeak
  - MathCAT Braille
  - SRE ClearSpeak
  - SRE MathSpeak
- Engine and channel status indicators for MathCAT/SRE
- Lint findings panels (A/B) with severities (`error`, `warn`, `info`, `ok`)
- Lint profile selector (`authoring-guidance`, `strict-core`)
- Intent suggestion panels (A/B) with W3C reference links
- A/B output diff panel (same channel only):
  - channel selector
  - unified diff view
  - side-by-side diff view
- Persistence and sharing:
  - auto-save to localStorage
  - load state from share URL query string
  - save state to JSON file
  - load state from JSON file
  - copy share URL to clipboard
- LaTeX conversion workflow:
  - separate `LaTeX Setup` and `LaTeX Input` fields
  - target selector for insertion into MathML A or B
  - fresh MathJax conversion document per run (iframe sandbox)
  - package extraction from setup text (`packages: ...` and `\\require{...}`)

## Share URL Keys

- `v` schema version
- `a` MathML A (base64url-encoded)
- `b` MathML B (base64url-encoded)
- `mjv` MathJax version id
- `mjo` MathJax output mode
- `ls` LaTeX setup (base64url-encoded)
- `lx` LaTeX input (base64url-encoded)

## Linter Docs

- Linter architecture and rule IDs: `/Users/brian/dev/cdx/mathml-explorer/LINTER.md`
- Browser/eTextbook compatibility map: `/Users/brian/dev/cdx/mathml-explorer/BROWSER_COMPATIBILITY.md`

## Runtime Notes

- SRE is loaded from CDN by default.
- MathCATForWeb defaults are pinned to tag `0.7.6-beta.1-web.1` via jsDelivr:
  - `mathcatJsUrl`: `https://cdn.jsdelivr.net/gh/brichwin/MathCATForWeb@0.7.6-beta.1-web.1/pkg/mathcat_web.js`
  - `mathcatWasmUrl`: `https://cdn.jsdelivr.net/gh/brichwin/MathCATForWeb@0.7.6-beta.1-web.1/pkg/mathcat_web_bg.wasm`
- Override runtime script URLs by defining `window.MLW_CONFIG` before `app.js` loads:

```html
<script>
  window.MLW_CONFIG = {
    mathcatTag: '0.7.6-beta.1-web.1',
    mathcatPkgBase: 'https://cdn.jsdelivr.net/gh/brichwin/MathCATForWeb@0.7.6-beta.1-web.1/pkg/',
    mathcatJsUrl: 'https://cdn.jsdelivr.net/gh/brichwin/MathCATForWeb@0.7.6-beta.1-web.1/pkg/mathcat_web.js',
    mathcatWasmUrl: 'https://cdn.jsdelivr.net/gh/brichwin/MathCATForWeb@0.7.6-beta.1-web.1/pkg/mathcat_web_bg.wasm',
    sreScriptUrl: 'https://cdn.jsdelivr.net/npm/speech-rule-engine@4.0.7/lib/sre.js'
  };
</script>
```

## Run Locally

Serve over a local web server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/src/`.

## Planned Milestones

- M8: Hardening, accessibility verification, docs

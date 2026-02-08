# EPUB Import Support

This app includes an EPUB import workflow for selecting MathML instances from EPUB content documents and importing them into MathML A/B.

## Supported Inputs

- Expanded EPUB folder (recommended): `Load Folder`
- Single content file: `Load File` (`.xhtml`, `.html`, `.xml`, `.opf`)

## Current `.epub` ZIP Note

Direct `.epub` ZIP parsing in-browser is not enabled in this build (no external zip library).

If you have a `.epub` package file, use the expanded folder workflow.

## What Gets Extracted

For each MathML node found in EPUB content documents:

- `id` (or generated instance ID)
- source content path
- `altimg`
- `alttext`
- normalized MathML string (`<math ...>` form)

## Content Discovery

When loading a folder:

- The importer attempts to read OPF spine order first.
- If OPF/spine parsing is unavailable, it falls back to scanning `.xhtml`, `.html`, and `.xml` files.

## Image Preview

When loading from expanded folder, the importer resolves `altimg` references relative to each source document and shows linked image previews if files are found.

## Import Flow

1. Load folder or file.
2. Select a MathML instance from the dropdown.
3. Choose import target (`MathML A` or `MathML B`).
4. Click `Import Selected MathML`.

## Files

- UI wiring: `/Users/brian/dev/cdx/mathml-explorer/src/index.html`
- Control logic: `/Users/brian/dev/cdx/mathml-explorer/src/app.js`
- Parser/loader: `/Users/brian/dev/cdx/mathml-explorer/src/epub.js`

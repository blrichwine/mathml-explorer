# NIMAS Import Support

This app includes a NIMAS import workflow for selecting MathML instances from DTBook XML and importing them into MathML A/B.

## Supported Inputs

- Expanded NIMAS folder (recommended): `Load Folder`
- Single NIMAS XML file: `Load XML`

## Current ZIP Note

Direct ZIP parsing in-browser is not enabled in this build (no external zip library).

If you have a `.zip` NIMAS set, use the expanded folder workflow.

## What Gets Extracted

For each MathML node (`m:math` in DTBook namespace):

- `id`
- `altimg`
- `alttext`
- normalized MathML string (`<math ...>` form)

## Image Preview

When loading from expanded folder, the importer resolves `altimg` references and shows linked image previews if files are found.

## Import Flow

1. Load folder or XML.
2. Select a MathML instance from the dropdown.
3. Choose import target (`MathML A` or `MathML B`).
4. Click `Import Selected MathML`.

## Files

- UI wiring: `/Users/brian/dev/cdx/mathml-explorer/src/index.html`
- Control logic: `/Users/brian/dev/cdx/mathml-explorer/src/app.js`
- Parser/loader: `/Users/brian/dev/cdx/mathml-explorer/src/nimas.js`

# MathML Linter

This document describes how the MathML linter works in this project, where rules came from, and how to extend it.

## File Location

- Linter implementation: `/Users/brian/dev/cdx/mathml-explorer/src/lint.js`
- MathML3 schema data source (imported/adapted): `/Users/brian/dev/cdx/mathml-explorer/src/mathml-data-v3.js`
- Canonical schema adapter (used by linter + editor context help): `/Users/brian/dev/cdx/mathml-explorer/src/mathml-schema-adapter.js`

## Current Scope

This linter is a **spec-aligned heuristic linter** for authoring guidance, not a complete schema validator.
Tag/attribute/child compatibility now uses a schema-driven base map built from `mathml-data-v3.js`, with local overlay rules for project-specific guidance checks.

## Profiles

The UI exposes four profiles:

- `presentation-mathml3` (default): Presentation MathML3-oriented checks with guidance hints.
- `core-mathml3`: Core-focused subset checks; guidance-only hints are suppressed and non-core patterns are emphasized.
- `presentation-mathml4`: provisional Presentation MathML4 profile using the same schema map as MathML3 until a dedicated MathML4 map is added.
- `core-mathml4`: provisional Core MathML4 profile using the same schema map as MathML3 until a dedicated MathML4 map is added.
  - Provisional MathML4 overlay currently applied: global `intent` allowance across presentation elements (for MathML3 pipelines adopting intent authoring).

It focuses on:
- XML well-formedness
- Known tag/attribute checks
- Parent/child compatibility checks
- Arity checks for fixed-structure elements
- Legacy/deprecated usage warnings
- Intent-oriented semantic hints
- Content MathML allowance inside `annotation` / `annotation-xml` wrappers for presentation/core linting

## Rule Sources

Rules are curated from MathML Core and MathML specification guidance, with direct references embedded in findings:

- MathML Core: [https://w3c.github.io/mathml-core/](https://w3c.github.io/mathml-core/)
- MathML fundamentals/syntax: [https://w3c.github.io/mathml/#fundamentals](https://w3c.github.io/mathml/#fundamentals)
- Presentation markup: [https://w3c.github.io/mathml/#presentation-markup](https://w3c.github.io/mathml/#presentation-markup)
- Intent expressions: [https://w3c.github.io/mathml/#intent-expressions](https://w3c.github.io/mathml/#intent-expressions)

## Lint Pipeline

`runLint(mathmlSource, { profile })` performs:

1. Parse XML using `DOMParser`
2. Fail early on parse errors (`error`)
3. Validate root element recommendation (`<math>`)
4. For each element, run rule groups:
- `validateTag`
- `validateAttributes`
- `validateChildren`
- `validateArity`
- `validateTokenContent`
- `validateCoreCompatibility`
- `validateSemanticsHints`
5. Deduplicate findings
6. Return results

## Finding Shape

Each finding includes:

- `severity`: `error | warn | info | ok`
- `code`: stable ID like `L030`
- `title`: short label
- `message`: user-facing explanation
- `reference`: spec URL
- `references`: optional labeled links (`spec`, `compat`, `project-note`) shown in the UI for deeper rationale

Example:

```json
{
  "severity": "warn",
  "code": "L030",
  "title": "Invalid child",
  "message": "<mtd> is not listed as a valid child of <mrow>.",
  "reference": "https://w3c.github.io/mathml-core/"
}
```

## Current Rule IDs

- `L001` empty expression
- `L002` invalid XML
- `L003` unexpected root
- `L004` missing `<math>` namespace declaration
- `L005` unexpected `<math>` namespace value
- `L006` assumed `xmlns:m` mapping for `<m:math>` inputs when missing
- `L010` unknown tag
- `L011` deprecated pattern
- `L012` tag outside selected lint profile
- `L020` unknown attribute
- `L021` invalid attribute value for constrained attributes
- `L022` `mathvariant` usage warning on non-`<mi>`
- `L023` uncommon (but recognized) `mathvariant` value
- `L024` potential split numeric literal across `<mn><mo>,</mo><mn>`
- `L025` suspicious script base (e.g., script base is only a closing fence `)`)
- `L026` potential plain-language word encoded as a run of single-letter `<mi>` tokens
- `L027` potential ambiguous large-operator operand (missing grouping `<mrow>` after large-op construct)
- `L028` split `<mi>` run matching a standard LaTeX function command name
- `L029` split `<mi>` run matching a likely `\operatorname{...}` function name
- `L031` missing U+2061 FUNCTION APPLICATION after recognized function-name `<mi>`
- `L032` deprecated attribute on `<math>` (`macros`, `mode`)
- `L033` negative `<mspace width>` spacing-conveyed-meaning warning
- `L034` potential overstruck symbol construct via `<mpadded>` negative spacing
- `L035` `<semantics>` with non-empty `<annotation-xml>` fallback may be ignored by common AT pipelines
- `L036` possible missing invisible times (`&#x2062;`) in linear tacit-multiplication contexts
- `L037` possible missing invisible separator (`&#x2063;`) in index-like omitted-comma contexts
- `L038` possible missing invisible plus (`&#x2064;`) in mixed-fraction implicit-addition contexts
- `L030` invalid child
- `L040` unexpected child count (exact arity)
- `L041` too few children (minimum arity)
- `L050` token structure warning
- `L070` element outside MathML Core compatibility subset
- `L071` potential non-core attribute compatibility warning
- `L072` at-risk element compatibility warning
- `L073` at-risk attribute compatibility warning
- `L060-L062` semantic/intent hints
- `L000` no findings

## Important Notes

- The linter intentionally trades completeness for clarity and authoring feedback speed.
- Some MathML constructs may still require rule expansion.
- This is not a formal conformance checker.
- Top-level `<math>` accessibility attributes used in NIMAS/MathML workflows are treated as valid and will not trigger `L020` unknown-attribute warnings:
  - `altimg`
  - `alttext`
  - `altimg-width`
  - `altimg-height`
  - `altimg-valign`

## How to Extend

1. Add/update tag definitions in `TAG_RULES`.
2. Update profile maps (`LINT_PROFILES`) and shared schema adapter wiring (`src/mathml-schema-adapter.js`) as needed.
3. For a dedicated MathML4 map, add version-specific rule sets and route by profile version.
4. Add new checks in dedicated `validate*` functions.
5. Add a stable lint code (`L###`) and a reference URL.
6. Keep messages actionable and non-ambiguous.
7. Update this document when introducing new rule classes.

## Future Improvements

- Replace provisional MathML4 profile mappings with a dedicated MathML4 schema data file
- Per-rule toggles in UI
- Precise location reporting (line/column)
- Optional JSON schema export of rule definitions

## Regression Tests

Because the linter depends on browser APIs (`DOMParser`), the current regression suite is browser-runner based:

- Test definitions: `/Users/brian/dev/cdx/mathml-explorer/src/lint-tests.js`
- Runner page: `/Users/brian/dev/cdx/mathml-explorer/src/lint-tests.html`

Run with local server and open:

- `http://localhost:8080/src/lint-tests.html`

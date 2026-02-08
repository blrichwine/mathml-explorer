# MathML Linter

This document describes how the MathML linter works in this project, where rules came from, and how to extend it.

## File Location

- Linter implementation: `/Users/brian/dev/cdx/mathml-explorer/src/lint.js`

## Current Scope

This linter is a **spec-aligned heuristic linter** for authoring guidance, not a complete schema validator.

## Profiles

The UI exposes two profiles:

- `authoring-guidance` (default): includes structural checks plus advisory semantics/intent hints.
- `strict-core`: focuses on strict structural checks; guidance-only hints are suppressed and deprecated patterns are escalated.

It focuses on:
- XML well-formedness
- Known tag/attribute checks
- Parent/child compatibility checks
- Arity checks for fixed-structure elements
- Legacy/deprecated usage warnings
- Intent-oriented semantic hints

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
- `L010` unknown tag
- `L011` deprecated pattern
- `L020` unknown attribute
- `L021` invalid attribute value for constrained attributes
- `L022` `mathvariant` usage warning on non-`<mi>`
- `L023` uncommon (but recognized) `mathvariant` value
- `L024` potential split numeric literal across `<mn><mo>,</mo><mn>`
- `L025` suspicious script base (e.g., script base is only a closing fence `)`)
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
2. Add new checks in dedicated `validate*` functions.
3. Add a stable lint code (`L###`) and a reference URL.
4. Keep messages actionable and non-ambiguous.
5. Update this document when introducing new rule classes.

## Future Improvements

- Split profiles: `strict-core` vs `authoring-guidance`
- Per-rule toggles in UI
- Precise location reporting (line/column)
- Optional JSON schema export of rule definitions

# MathML Browser Compatibility Map

This document is a practical compatibility guide for MathML review in browser-engine-based eTextbook platforms.

It complements the linter in:
- `/Users/brian/dev/cdx/mathml-explorer/src/lint.js`

## Why This Exists

Many eTextbook systems render via browser engines (or embedded browser components), but platform wrappers and conversion pipelines may reduce effective support.

This map helps flag:
- Core-safe constructs
- At-risk constructs
- Clearly non-core constructs for browser-focused compatibility

## Tiers

- `core`: generally aligned with MathML Core support expectations
- `at-risk`: may work in some engines/wrappers but not consistently in all eTextbook pipelines
- `non-core`: outside browser-focused MathML Core subset; treat as compatibility risk by default

## Element Map (Current)

### Core

- `math`
- `mrow`
- `mi`
- `mn`
- `mo`
- `mtext`
- `mspace`
- `mfrac`
- `msup`
- `msub`
- `msubsup`
- `msqrt`
- `mroot`
- `mtable`
- `mtr`
- `mtd`

### At-risk

- `mlabeledtr`
- `mfenced`
- `mstyle`
- `menclose`
- `mpadded`
- `mphantom`
- `merror`

### Non-core

- `semantics`
- `annotation`
- `annotation-xml`
- `maction`

## Attribute Map (Current)

### Non-core oriented

- `encoding`
- `src`
- `actiontype`
- `selection`

### At-risk

- `scriptminsize`
- `scriptsizemultiplier`

## Linter Rule IDs for Compatibility

- `L070`: element outside MathML Core subset
- `L071`: potential non-core attribute
- `L072`: at-risk element compatibility
- `L073`: at-risk attribute compatibility

## How to Use for eTextbook QA

1. Start with `strict-core` profile.
2. Treat `L070/L071` as high-importance compatibility warnings.
3. Treat `L072/L073` as platform validation candidates.
4. Validate flagged constructs in each target reading platform/webview.

## Caveat

This map is intentionally practical and conservative, not a formal browser-by-browser conformance matrix.

For contractual/platform rollout decisions, run platform-specific rendering tests in addition to lint findings.

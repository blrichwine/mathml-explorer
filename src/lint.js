const SPEC_LINKS = {
  core: 'https://w3c.github.io/mathml-core/',
  intent: 'https://w3c.github.io/mathml/#intent-expressions',
  presentation: 'https://w3c.github.io/mathml/#presentation-markup',
  syntax: 'https://w3c.github.io/mathml/#fundamentals'
};
const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

const GLOBAL_ATTRIBUTES = new Set([
  'class',
  'style',
  'id',
  'display',
  'mathsize',
  'mathcolor',
  'dir',
  'href',
  'intent',
  'arg',
  'data-*'
]);

const TOKEN_ELEMENTS = new Set(['mi', 'mn', 'mo', 'mtext', 'ms']);
const DEPRECATED_TAGS = new Set(['mfenced', 'mstyle']);
const ELEMENT_COMPAT = {
  math: { tier: 'core', note: 'Core presentation root.' },
  mrow: { tier: 'core', note: 'Core grouping construct.' },
  mi: { tier: 'core', note: 'Core token element.' },
  mn: { tier: 'core', note: 'Core token element.' },
  mo: { tier: 'core', note: 'Core operator element.' },
  mtext: { tier: 'core', note: 'Core token element.' },
  ms: { tier: 'core', note: 'Core token element.' },
  mspace: { tier: 'core', note: 'Core spacing element.' },
  mfrac: { tier: 'core', note: 'Core fraction element.' },
  msup: { tier: 'core', note: 'Core script element.' },
  msub: { tier: 'core', note: 'Core script element.' },
  msubsup: { tier: 'core', note: 'Core script element.' },
  mmultiscripts: { tier: 'core', note: 'Core script element.' },
  mprescripts: { tier: 'core', note: 'Core script marker element.' },
  none: { tier: 'core', note: 'Core script placeholder element.' },
  mover: { tier: 'core', note: 'Core script element.' },
  munder: { tier: 'core', note: 'Core script element.' },
  munderover: { tier: 'core', note: 'Core script element.' },
  msqrt: { tier: 'core', note: 'Core radical element.' },
  mroot: { tier: 'core', note: 'Core radical element.' },
  mtable: { tier: 'core', note: 'Core table structure.' },
  mtr: { tier: 'core', note: 'Core table row.' },
  mtd: { tier: 'core', note: 'Core table cell.' },
  mlabeledtr: { tier: 'at-risk', note: 'Support varies across browser engines/platform wrappers.' },

  semantics: { tier: 'non-core', note: 'Outside MathML Core browser-focused subset.' },
  annotation: { tier: 'non-core', note: 'Outside MathML Core browser-focused subset.' },
  'annotation-xml': { tier: 'non-core', note: 'Outside MathML Core browser-focused subset.' },
  mfenced: { tier: 'at-risk', note: 'Legacy/deprecated usage pattern.' },
  mstyle: { tier: 'at-risk', note: 'Legacy/deprecated usage pattern.' },
  menclose: { tier: 'at-risk', note: 'Not consistently supported in all browser-derived renderers.' },
  mpadded: { tier: 'at-risk', note: 'Not consistently supported in all browser-derived renderers.' },
  mphantom: { tier: 'at-risk', note: 'Not consistently supported in all browser-derived renderers.' },
  maction: { tier: 'non-core', note: 'Interactive actions are commonly unsupported in browser MathML pipelines.' },
  merror: { tier: 'at-risk', note: 'Not consistently exposed/rendered in eTextbook pipelines.' }
};

const ATTRIBUTE_COMPAT = {
  encoding: { tier: 'non-core', note: 'Commonly tied to non-core annotation workflows.' },
  src: { tier: 'non-core', note: 'External annotation source behavior varies by host platform.' },
  actiontype: { tier: 'non-core', note: 'Associated with maction (non-core).' },
  selection: { tier: 'non-core', note: 'Associated with maction (non-core).' },
  scriptminsize: { tier: 'at-risk', note: 'Legacy styling control with uneven support.' },
  scriptsizemultiplier: { tier: 'at-risk', note: 'Legacy styling control with uneven support.' }
};

const DEPRECATED_MATH_ATTRIBUTES = new Map([
  [
    'macros',
    {
      replacement: 'none',
      note: 'External macro definition files are not part of MathML.'
    }
  ],
  [
    'mode',
    {
      replacement: 'display',
      note: 'Use the MathML "display" attribute instead.'
    }
  ]
]);

const CHILDREN_PRESENTATION = [
  'mrow', 'mi', 'mn', 'mo', 'mtext', 'ms', 'mspace',
  'mfrac', 'msup', 'msub', 'msubsup', 'mmultiscripts', 'mover', 'munder', 'munderover',
  'msqrt', 'mroot', 'mtable', 'semantics',
  'mstyle', 'merror', 'mpadded', 'mphantom', 'menclose', 'maction'
];

const TAG_RULES = {
  math: {
    children: [...CHILDREN_PRESENTATION],
    attributes: ['xmlns', 'display', 'mathvariant', 'intent', 'altimg', 'alttext', 'altimg-width', 'altimg-height', 'altimg-valign'],
    arity: { min: 1 }
  },
  mrow: { children: [...CHILDREN_PRESENTATION, 'mrow'], attributes: ['intent'] },
  mi: { children: [], attributes: ['mathvariant', 'intent'] },
  mn: { children: [], attributes: ['mathvariant', 'intent'] },
  mo: { children: [], attributes: ['mathvariant', 'form', 'fence', 'separator', 'stretchy', 'symmetric', 'intent'] },
  mtext: { children: [], attributes: ['mathvariant', 'intent'] },
  ms: { children: [], attributes: ['mathvariant', 'lquote', 'rquote', 'intent'] },
  mspace: { children: [], attributes: ['width', 'height', 'depth'] },
  mfrac: { children: [...CHILDREN_PRESENTATION], attributes: ['linethickness', 'bevelled', 'intent'], arity: { exact: 2 } },
  msup: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { exact: 2 } },
  msub: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { exact: 2 } },
  msubsup: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { exact: 3 } },
  mmultiscripts: { children: [...CHILDREN_PRESENTATION, 'mprescripts', 'none'], attributes: ['intent'], arity: { min: 1 } },
  mprescripts: { children: [], attributes: [] },
  none: { children: [], attributes: [] },
  mover: { children: [...CHILDREN_PRESENTATION], attributes: ['accent', 'intent'], arity: { exact: 2 } },
  munder: { children: [...CHILDREN_PRESENTATION], attributes: ['accentunder', 'intent'], arity: { exact: 2 } },
  munderover: { children: [...CHILDREN_PRESENTATION], attributes: ['accent', 'accentunder', 'intent'], arity: { exact: 3 } },
  msqrt: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { min: 1 } },
  mroot: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { exact: 2 } },
  mfenced: { children: [...CHILDREN_PRESENTATION], attributes: ['open', 'close', 'separators', 'intent'] },
  menclose: { children: ['any'], attributes: ['notation', 'intent'], arity: { min: 1 } },
  merror: { children: ['any'], attributes: ['intent'], arity: { min: 1 } },
  mpadded: { children: ['any'], attributes: ['width', 'height', 'depth', 'lspace', 'voffset', 'intent'], arity: { min: 1 } },
  mphantom: { children: ['any'], attributes: ['intent'], arity: { min: 1 } },
  maction: { children: ['any'], attributes: ['actiontype', 'selection', 'intent'], arity: { min: 1 } },
  mtable: { children: ['mtr', 'mlabeledtr'], attributes: ['columnalign', 'rowalign', 'intent'] },
  mtr: { children: ['mtd'], attributes: ['intent'] },
  mlabeledtr: { children: ['mtd'], attributes: ['intent'], arity: { min: 1 } },
  mtd: { children: [...CHILDREN_PRESENTATION], attributes: ['rowspan', 'columnspan', 'intent'], arity: { min: 1 } },
  semantics: { children: ['mrow', ...CHILDREN_PRESENTATION, 'annotation', 'annotation-xml'], attributes: ['intent'], arity: { min: 1 } },
  annotation: { children: [], attributes: ['encoding', 'src'] },
  'annotation-xml': { children: ['any'], attributes: ['encoding', 'src'] },
  mstyle: { children: ['any'], attributes: ['mathvariant', 'displaystyle', 'scriptlevel'], arity: { min: 1 } }
};

const ATTRIBUTE_VALUE_RULES = [
  {
    attr: 'display',
    tags: new Set(['math']),
    expected: '"block" or "inline"',
    validate: (value) => value === 'block' || value === 'inline'
  },
  {
    attr: 'dir',
    tags: null,
    expected: '"ltr", "rtl", or "auto"',
    validate: (value) => value === 'ltr' || value === 'rtl' || value === 'auto'
  },
  {
    attr: 'form',
    tags: new Set(['mo']),
    expected: '"prefix", "infix", or "postfix"',
    validate: (value) => value === 'prefix' || value === 'infix' || value === 'postfix'
  },
  {
    attr: 'fence',
    tags: new Set(['mo']),
    expected: '"true" or "false"',
    validate: isBooleanToken
  },
  {
    attr: 'separator',
    tags: new Set(['mo']),
    expected: '"true" or "false"',
    validate: isBooleanToken
  },
  {
    attr: 'stretchy',
    tags: new Set(['mo']),
    expected: '"true" or "false"',
    validate: isBooleanToken
  },
  {
    attr: 'symmetric',
    tags: new Set(['mo']),
    expected: '"true" or "false"',
    validate: isBooleanToken
  },
  {
    attr: 'bevelled',
    tags: new Set(['mfrac']),
    expected: '"true" or "false"',
    validate: isBooleanToken
  },
  {
    attr: 'displaystyle',
    tags: new Set(['mstyle']),
    expected: '"true" or "false"',
    validate: isBooleanToken
  },
  {
    attr: 'columnalign',
    tags: new Set(['mtable']),
    expected: 'space-separated values from "left", "center", "right", "decimalpoint"',
    validate: (value) => isTokenList(value, new Set(['left', 'center', 'right', 'decimalpoint']))
  },
  {
    attr: 'rowalign',
    tags: new Set(['mtable']),
    expected: 'space-separated values from "top", "bottom", "center", "baseline", "axis"',
    validate: (value) => isTokenList(value, new Set(['top', 'bottom', 'center', 'baseline', 'axis']))
  },
  {
    attr: 'mathvariant',
    tags: null,
    expected:
      '"normal", "bold", "italic", "bold-italic", "double-struck", "script", "fraktur", "sans-serif", "monospace", or another recognized MathML mathvariant token',
    validate: (value) => KNOWN_MATHVARIANT_VALUES.has(value)
  }
];

const COMMON_MATHVARIANT_VALUES = new Set([
  'normal',
  'bold',
  'italic',
  'bold-italic',
  'double-struck',
  'script',
  'fraktur',
  'sans-serif',
  'monospace'
]);

const KNOWN_MATHVARIANT_VALUES = new Set([
  ...COMMON_MATHVARIANT_VALUES,
  'bold-fraktur',
  'sans-serif-italic',
  'sans-serif-bold-italic',
  'bold-sans-serif',
  'bold-script',
  'initial',
  'tailed',
  'looped',
  'stretched'
]);

function runLint(mathmlSource, options = {}) {
  const source = String(mathmlSource || '');
  const findings = [];
  const profile = normalizeProfile(options.profile);
  const ignoreDataMjxAttributes = options.ignoreDataMjxAttributes !== false;

  if (!source.trim()) {
    findings.push(makeFinding('info', 'L001', 'Empty expression', 'No MathML entered yet.', SPEC_LINKS.syntax));
    return { sourceLength: source.length, findings };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'application/xml');
  const parseError = doc.querySelector('parsererror');

  if (parseError) {
    findings.push(makeFinding('error', 'L002', 'Invalid XML', parseError.textContent || 'MathML is not well-formed XML.', SPEC_LINKS.syntax));
    return { sourceLength: source.length, findings };
  }

  const root = doc.documentElement;
  if (normalize(root.tagName) !== 'math') {
    findings.push(makeFinding('warn', 'L003', 'Unexpected root', `Root element is <${root.tagName}>. A top-level <math> is recommended.`, SPEC_LINKS.presentation));
  } else {
    validateMathRootNamespace(findings, root);
  }

  const allElements = [...doc.querySelectorAll('*')];
  for (const node of allElements) {
    validateTag(findings, node, profile);
    validateAttributes(findings, node, { ignoreDataMjxAttributes });
    validateAttributeValues(findings, node);
    validateMathvariantUsage(findings, node);
    validateNegativeSpacingPatterns(findings, node);
    validatePotentialSplitNumberLiteral(findings, node);
    validateSuspiciousScriptBase(findings, node);
    validateFunctionNameMiRuns(findings, node);
    validateMissingFunctionApplication(findings, node);
    validatePotentialPlainLanguageMiRuns(findings, node);
    validateAmbiguousLargeOperatorOperand(findings, node);
    validateSemanticsAnnotationSupportWarning(findings, node);
    validateChildren(findings, node);
    validateArity(findings, node);
    validateTokenContent(findings, node);
    validateCoreCompatibility(findings, node, profile);
    validateSemanticsHints(findings, node, profile);
  }

  if (!findings.length) {
    findings.push(makeFinding('ok', 'L000', 'No lint findings', 'No structural issues found in the current lint profile.', SPEC_LINKS.core));
  }

  return {
    sourceLength: source.length,
    findings: dedupeFindings(findings)
  };
}

function validateMathvariantUsage(findings, node) {
  const tag = normalize(node.tagName);
  if (!node.hasAttribute('mathvariant')) {
    return;
  }

  const rawValue = String(node.getAttribute('mathvariant') || '').trim();
  const value = normalize(rawValue);

  if (tag !== 'mi') {
    findings.push(
      makeFinding(
        'warn',
        'L022',
        'mathvariant usage warning',
        `Attribute "mathvariant" on <${tag}> is discouraged in modern MathML Core workflows; prefer direct Unicode character mapping when possible.`,
        SPEC_LINKS.core
      )
    );
  }

  if (value && KNOWN_MATHVARIANT_VALUES.has(value) && !COMMON_MATHVARIANT_VALUES.has(value)) {
    findings.push(
      makeFinding(
        'info',
        'L023',
        'Uncommon mathvariant value',
        `mathvariant="${rawValue}" is recognized but uncommon. Common values include normal, bold, italic, bold-italic, double-struck, script, fraktur, sans-serif, and monospace.`,
        SPEC_LINKS.presentation
      )
    );
  }
}

function validateNegativeSpacingPatterns(findings, node) {
  const tag = normalize(node.tagName);

  if (tag === 'mspace' && isNegativeLength(node.getAttribute('width'))) {
    findings.push(
      makeFinding(
        'warn',
        'L033',
        'Negative spacing pattern',
        'Negative <mspace width> is strongly discouraged for constructing symbols or conveying meaning through spacing.',
        SPEC_LINKS.presentation
      )
    );
    return;
  }

  if (tag === 'mpadded' && isPotentialOverstrikeMpadded(node)) {
    findings.push(
      makeFinding(
        'warn',
        'L034',
        'Potential overstruck spacing construct',
        '<mpadded> appears to be used with negative spacing to visually combine symbols. Prefer a standard symbol encoding instead of spacing-based symbol construction.',
        SPEC_LINKS.presentation
      )
    );
  }
}

function validatePotentialSplitNumberLiteral(findings, node) {
  const children = [...node.children];
  if (children.length < 3) {
    return;
  }

  const operatorChildren = children.filter((child) => normalize(child.tagName) === 'mo');
  if (!operatorChildren.length) {
    return;
  }

  const onlyCommaOperators = operatorChildren.every((child) => child.textContent.trim() === ',');
  if (!onlyCommaOperators) {
    return;
  }

  let runCount = 0;
  for (let i = 0; i <= children.length - 3; i += 1) {
    const left = children[i];
    const middle = children[i + 1];
    const right = children[i + 2];
    if (
      normalize(left.tagName) === 'mn' &&
      normalize(middle.tagName) === 'mo' &&
      normalize(right.tagName) === 'mn' &&
      isNumericToken(left.textContent) &&
      middle.textContent.trim() === ',' &&
      isNumericToken(right.textContent)
    ) {
      runCount += 1;
    }
  }

  if (!runCount) {
    return;
  }

  const tag = normalize(node.tagName);
  findings.push(
    makeFinding(
      'warn',
      'L024',
      'Potential split number literal',
      `<${tag}> contains ${runCount} comma-separated <mn>/<mo>/<mn> run(s). If this is one formatted number (e.g., 200,300.87), consider a single <mn> token.`,
      SPEC_LINKS.presentation
    )
  );
}

function validateSuspiciousScriptBase(findings, node) {
  const tag = normalize(node.tagName);
  if (!SCRIPT_BASE_TAGS.has(tag)) {
    return;
  }

  const base = node.children[0];
  if (!base) {
    return;
  }

  if (normalize(base.tagName) !== 'mo') {
    return;
  }

  const token = base.textContent.trim();
  if (!CLOSING_FENCE_TOKENS.has(token)) {
    return;
  }

  findings.push(
    makeFinding(
      'warn',
      'L025',
      'Suspicious script base',
      `<${tag}> uses <mo>${token}</mo> as its base. This often indicates grouping loss; consider wrapping the intended base expression in <mrow>.`,
      SPEC_LINKS.presentation
    )
  );
}

function validatePotentialPlainLanguageMiRuns(findings, node) {
  const children = [...node.children];
  if (children.length < 3) {
    return;
  }

  const runs = collectLowercaseMiRuns(children);
  for (const run of runs) {
    const word = run.word;
    const likelyPlainWord = word.length >= 4 || LIKELY_PLAIN_TEXT_WORDS.has(word);
    if (!likelyPlainWord) {
      continue;
    }

    findings.push(
      makeFinding(
        'warn',
        'L026',
        'Potential plain-language text in <mi> tokens',
        `Detected <mi> letter run "${word}" (${run.length} tokens). Consider using <mtext> or adding intent if this is a word rather than symbolic identifiers.`,
        SPEC_LINKS.intent
      )
    );
  }
}

function validateFunctionNameMiRuns(findings, node) {
  const children = [...node.children];
  if (children.length < 2) {
    return;
  }

  const runs = collectLowercaseMiRuns(children);
  for (const run of runs) {
    const word = run.word;

    if (LATEX_BUILTIN_FUNCTION_NAMES.has(word)) {
      findings.push(
        makeFinding(
          'warn',
          'L028',
          'Potential missing LaTeX function command',
          `Detected split <mi> run "${word}". This matches a standard LaTeX function name; consider using the built-in function command (for example \\${word}) to preserve function semantics.`,
          SPEC_LINKS.intent
        )
      );
      continue;
    }

    if (OPERATORNAME_FUNCTION_NAMES.has(word)) {
      findings.push(
        makeFinding(
          'warn',
          'L029',
          'Potential missing \\operatorname',
          `Detected split <mi> run "${word}". This appears to be a common function name that is often authored with \\operatorname{${word}} for proper semantics.`,
          SPEC_LINKS.intent
        )
      );
    }
  }
}

function validateMissingFunctionApplication(findings, node) {
  const children = [...node.children];
  if (!children.length) {
    return;
  }

  for (let i = 0; i < children.length; i += 1) {
    const current = children[i];
    if (normalize(current.tagName) !== 'mi') {
      continue;
    }

    const token = String(current.textContent || '').trim().toLowerCase();
    if (!LATEX_BUILTIN_FUNCTION_NAMES.has(token)) {
      continue;
    }

    const next = children[i + 1] || null;
    if (next && isApplyFunctionMo(next)) {
      continue;
    }

    findings.push(
      makeFinding(
        'warn',
        'L031',
        'Missing function application marker',
        `<mi>${token}</mi> appears to be a function name but is not followed by U+2061 FUNCTION APPLICATION (<mo>&#x2061;</mo>). Consider adding it for clearer parsing and speech output.`,
        SPEC_LINKS.intent
      )
    );
  }
}

function validateAmbiguousLargeOperatorOperand(findings, node) {
  const children = [...node.children];
  if (children.length < 2) {
    return;
  }

  for (let i = 0; i < children.length; i += 1) {
    const current = children[i];
    if (!isLargeOperatorConstruct(current)) {
      continue;
    }

    const following = children.slice(i + 1);
    if (following.length < 2) {
      continue;
    }

    const firstFollowingTag = normalize(following[0].tagName);
    if (firstFollowingTag === 'mrow') {
      continue;
    }

    findings.push(
      makeFinding(
        'warn',
        'L027',
        'Potential ambiguous large-operator operand',
        `A large-operator construct is followed by an ungrouped operand sequence. Consider wrapping the intended operand in <mrow> for clear structure and speech output.`,
        SPEC_LINKS.intent
      )
    );
  }
}

function validateSemanticsAnnotationSupportWarning(findings, node) {
  if (normalize(node.tagName) !== 'semantics') {
    return;
  }

  const annotations = [...node.children].filter((child) => normalize(child.tagName) === 'annotation-xml');
  const hasNonEmptyAnnotation = annotations.some((entry) => entry.children.length > 0 || String(entry.textContent || '').trim() !== '');
  if (!hasNonEmptyAnnotation) {
    return;
  }

  findings.push(
    makeFinding(
      'warn',
      'L035',
      'Limited support for semantics annotation fallback',
      '<semantics> with non-empty <annotation-xml> is present, but this fallback pattern is not consistently honored by common assistive technology pipelines.',
      SPEC_LINKS.presentation
    )
  );
}

function validateMathRootNamespace(findings, root) {
  const rawTag = String(root.tagName || '');
  const xmlns = root.getAttribute('xmlns');

  // Mild warning only for an unprefixed <math> root missing the default MathML namespace.
  if (!xmlns && rawTag.toLowerCase() === 'math') {
    findings.push(
      makeFinding(
        'warn',
        'L004',
        'Missing namespace declaration',
        `Root <math> is missing xmlns="${MATHML_NAMESPACE}".`,
        SPEC_LINKS.syntax
      )
    );
    return;
  }

  if (typeof xmlns === 'string' && xmlns.trim() && xmlns.trim() !== MATHML_NAMESPACE) {
    findings.push(
      makeFinding(
        'warn',
        'L005',
        'Unexpected MathML namespace',
        `Root <math> has xmlns="${xmlns}", expected "${MATHML_NAMESPACE}".`,
        SPEC_LINKS.syntax
      )
    );
  }
}

function validateTag(findings, node, profile) {
  const tag = normalize(node.tagName);

  if (!TAG_RULES[tag]) {
    findings.push(makeFinding('warn', 'L010', 'Unknown tag', `Element <${tag}> is not recognized in the current lint profile.`, SPEC_LINKS.core));
    return;
  }

  if (DEPRECATED_TAGS.has(tag)) {
    const severity = profile === 'strict-core' ? 'error' : 'warn';
    findings.push(makeFinding(severity, 'L011', 'Deprecated pattern', `Element <${tag}> is legacy in many workflows. Prefer modern structure where possible.`, SPEC_LINKS.presentation));
  }
}

function validateAttributes(findings, node, options = {}) {
  const tag = normalize(node.tagName);
  const rule = TAG_RULES[tag];
  const allowed = new Set([...(rule?.attributes || []), ...GLOBAL_ATTRIBUTES]);
  const ignoreDataMjxAttributes = options.ignoreDataMjxAttributes !== false;

  for (const attr of [...node.attributes]) {
    const attrName = attr.name;
    const normalizedAttrName = normalize(attrName);

    if (tag === 'math' && DEPRECATED_MATH_ATTRIBUTES.has(normalizedAttrName)) {
      const meta = DEPRECATED_MATH_ATTRIBUTES.get(normalizedAttrName);
      const replacement = meta.replacement === 'none' ? 'This attribute should be removed.' : `Use "${meta.replacement}" instead.`;
      findings.push(
        makeFinding(
          'warn',
          'L032',
          'Deprecated attribute on <math>',
          `Attribute "${attrName}" on <math> is deprecated. ${replacement} ${meta.note}`,
          SPEC_LINKS.presentation
        )
      );
      continue;
    }

    if (/^data-mjx/i.test(attrName)) {
      if (ignoreDataMjxAttributes) {
        continue;
      }
      findings.push(makeFinding('warn', 'L020', 'Unknown attribute', `Attribute "${attrName}" is not recognized on <${tag}>.`, SPEC_LINKS.presentation));
      continue;
    }

    if (attrName.startsWith('data-')) {
      continue;
    }

    if (!allowed.has(attrName)) {
      findings.push(makeFinding('warn', 'L020', 'Unknown attribute', `Attribute "${attrName}" is not recognized on <${tag}>.`, SPEC_LINKS.presentation));
    }
  }
}

function validateAttributeValues(findings, node) {
  const tag = normalize(node.tagName);

  for (const attr of [...node.attributes]) {
    const attrName = normalize(attr.name);
    const value = String(attr.value || '').trim();
    const rules = ATTRIBUTE_VALUE_RULES.filter((rule) => rule.attr === attrName && (!rule.tags || rule.tags.has(tag)));

    for (const rule of rules) {
      if (!value) {
        findings.push(
          makeFinding(
            'warn',
            'L021',
            'Invalid attribute value',
            `Attribute "${attr.name}" on <${tag}> should be ${rule.expected}, but it is empty.`,
            SPEC_LINKS.presentation
          )
        );
        continue;
      }

      if (!rule.validate(normalize(value), value)) {
        findings.push(
          makeFinding(
            'warn',
            'L021',
            'Invalid attribute value',
            `Attribute "${attr.name}" on <${tag}> has value "${attr.value}". Expected ${rule.expected}.`,
            SPEC_LINKS.presentation
          )
        );
      }
    }
  }
}

function validateChildren(findings, node) {
  const parentTag = normalize(node.tagName);
  const parentRule = TAG_RULES[parentTag];

  if (!parentRule || parentRule.children.includes('any')) {
    return;
  }

  for (const child of [...node.children]) {
    const childTag = normalize(child.tagName);
    if (!parentRule.children.includes(childTag)) {
      findings.push(makeFinding('warn', 'L030', 'Invalid child', `<${childTag}> is not listed as a valid child of <${parentTag}>.`, SPEC_LINKS.core));
    }
  }
}

function validateArity(findings, node) {
  const tag = normalize(node.tagName);
  const arity = TAG_RULES[tag]?.arity;
  if (!arity) {
    return;
  }

  const count = node.children.length;

  if (typeof arity.exact === 'number' && count !== arity.exact) {
    findings.push(makeFinding('warn', 'L040', 'Unexpected child count', `<${tag}> should have exactly ${arity.exact} element children; found ${count}.`, SPEC_LINKS.core));
  }

  if (typeof arity.min === 'number' && count < arity.min) {
    findings.push(makeFinding('warn', 'L041', 'Too few children', `<${tag}> should have at least ${arity.min} element children; found ${count}.`, SPEC_LINKS.core));
  }
}

function validateTokenContent(findings, node) {
  const tag = normalize(node.tagName);
  if (!TOKEN_ELEMENTS.has(tag)) {
    return;
  }

  if (node.children.length > 0) {
    findings.push(makeFinding('warn', 'L050', 'Token structure', `<${tag}> should generally contain text content, not nested elements.`, SPEC_LINKS.presentation));
  }
}

function validateCoreCompatibility(findings, node, profile) {
  const tag = normalize(node.tagName);
  const elementCompat = ELEMENT_COMPAT[tag];

  if (elementCompat?.tier === 'non-core') {
    findings.push(
      makeFinding(
        profile === 'strict-core' ? 'warn' : 'info',
        'L070',
        'Outside MathML Core',
        `<${tag}> is outside the MathML Core browser-focused subset. ${elementCompat.note}`,
        SPEC_LINKS.core
      )
    );
  } else if (elementCompat?.tier === 'at-risk') {
    findings.push(
      makeFinding(
        profile === 'strict-core' ? 'warn' : 'info',
        'L072',
        'At-risk browser compatibility',
        `<${tag}> is in a compatibility gray-zone for browser-engine/eTextbook pipelines. ${elementCompat.note}`,
        SPEC_LINKS.core
      )
    );
  }

  for (const attr of [...node.attributes]) {
    const attrName = normalize(attr.name);
    const attrCompat = ATTRIBUTE_COMPAT[attrName];
    if (!attrCompat) {
      continue;
    }
    const code = attrCompat.tier === 'non-core' ? 'L071' : 'L073';
    const title = attrCompat.tier === 'non-core' ? 'Potential non-core attribute' : 'At-risk attribute compatibility';
    findings.push(
      makeFinding(
        profile === 'strict-core' ? 'warn' : 'info',
        code,
        title,
        `Attribute \"${attr.name}\" on <${tag}> may not be consistently supported in browser-focused MathML pipelines. ${attrCompat.note}`,
        SPEC_LINKS.core
      )
    );
  }
}

function validateSemanticsHints(findings, node, profile) {
  if (profile === 'strict-core') {
    return;
  }

  const tag = normalize(node.tagName);

  if (tag === 'mrow' && node.children.length > 5 && !node.hasAttribute('intent')) {
    findings.push(makeFinding('info', 'L060', 'Semantics hint', 'Large <mrow> group has no intent. Consider intent for disambiguation.', SPEC_LINKS.intent));
  }

  if (tag === 'mi' && node.textContent.trim().length > 1 && !node.hasAttribute('intent')) {
    findings.push(makeFinding('info', 'L061', 'Semantics hint', `<${tag}> with multi-character token may need explicit intent depending on meaning.`, SPEC_LINKS.intent));
  }

  if (tag === 'mn' && node.textContent.trim().length > 1 && !node.hasAttribute('intent') && !looksLikeNumericLiteral(node.textContent)) {
    findings.push(makeFinding('info', 'L061', 'Semantics hint', `<${tag}> with multi-character token may need explicit intent depending on meaning.`, SPEC_LINKS.intent));
  }

  if (tag === 'semantics' && !node.querySelector('annotation, annotation-xml')) {
    findings.push(makeFinding('info', 'L062', 'Semantics hint', '<semantics> is present without annotation payload; verify intent of using semantics wrapper.', SPEC_LINKS.presentation));
  }
}

function makeFinding(severity, code, title, message, reference) {
  return { severity, code, title, message, reference };
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((item) => {
    const key = `${item.severity}|${item.code}|${item.title}|${item.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function normalizeProfile(profile) {
  return profile === 'strict-core' ? 'strict-core' : 'authoring-guidance';
}

const SCRIPT_BASE_TAGS = new Set(['msup', 'msub', 'msubsup', 'mover', 'munder', 'munderover', 'mmultiscripts']);
const CLOSING_FENCE_TOKENS = new Set([')', ']', '}', '\u27e9', '\u27eb', '\u3009', '\u300b', '\u300d', '\u300f', '\u3011', '\u3015', '\u3017', '\u3019', '\u301b']);
const LATEX_BUILTIN_FUNCTION_NAMES = new Set([
  'cos', 'sin', 'tan', 'csc', 'sec', 'cot',
  'cosh', 'sinh', 'tanh', 'coth',
  'arccos', 'arcsin', 'arctan',
  'log', 'ln', 'lg', 'exp',
  'lim', 'liminf', 'limsup',
  'min', 'max', 'sup', 'inf'
]);
const OPERATORNAME_FUNCTION_NAMES = new Set([
  'sech', 'csch',
  'arsinh', 'arcsinh',
  'arcosh', 'arccosh',
  'artanh', 'arctanh'
]);
const LARGE_OPERATOR_SYMBOLS = new Set(['∑', '∏', '∫', '∮', '⋃', '⋂']);
const LARGE_OPERATOR_WORDS = new Set(['lim']);
const LIKELY_PLAIN_TEXT_WORDS = new Set([
  'and',
  'but',
  'all',
  'the',
  'for',
  'with',
  'from',
  'into',
  'over',
  'under',
  'time',
  'distance',
  'velocity'
]);

function isBooleanToken(value) {
  return value === 'true' || value === 'false';
}

function isTokenList(value, allowedTokens) {
  const tokens = String(value || '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return false;
  }

  return tokens.every((token) => allowedTokens.has(token));
}

function isNumericToken(value) {
  const text = String(value || '').trim();
  return /^\d+(?:\.\d+)?$/.test(text);
}

function isNegativeLength(value) {
  const text = String(value || '').trim();
  if (!text) {
    return false;
  }
  return /^-/.test(text);
}

function isPotentialOverstrikeMpadded(node) {
  if (hasNegativeMpaddedAttribute(node)) {
    return true;
  }

  const directChildren = [...node.children];
  const hasNegativeMspaceChild = directChildren.some((child) => normalize(child.tagName) === 'mspace' && isNegativeLength(child.getAttribute('width')));
  const hasVisibleSibling = directChildren.some((child) => normalize(child.tagName) === 'mtext' || normalize(child.tagName) === 'mi' || normalize(child.tagName) === 'mo');

  return hasNegativeMspaceChild && hasVisibleSibling;
}

function hasNegativeMpaddedAttribute(node) {
  const attrs = ['width', 'lspace', 'height', 'depth', 'voffset'];
  return attrs.some((name) => isNegativeLength(node.getAttribute(name)));
}

function isLargeOperatorConstruct(node) {
  const tag = normalize(node.tagName);
  if (isLargeOperatorTokenNode(node)) {
    return true;
  }

  if (tag === 'munderover' || tag === 'munder' || tag === 'mover' || tag === 'msubsup' || tag === 'msub' || tag === 'msup') {
    const base = node.children[0];
    return Boolean(base && isLargeOperatorTokenNode(base));
  }

  return false;
}

function isLargeOperatorTokenNode(node) {
  const tag = normalize(node.tagName);
  if (tag !== 'mo' && tag !== 'mi' && tag !== 'mtext') {
    return false;
  }

  const token = String(node.textContent || '').trim();
  if (!token) {
    return false;
  }

  if (LARGE_OPERATOR_SYMBOLS.has(token)) {
    return true;
  }

  return LARGE_OPERATOR_WORDS.has(token.toLowerCase());
}

function collectLowercaseMiRuns(children) {
  const runs = [];
  let currentChars = [];
  let currentStart = -1;

  function flushRun(endIndex) {
    if (!currentChars.length) {
      return;
    }
    runs.push({
      word: currentChars.join(''),
      length: currentChars.length,
      startIndex: currentStart,
      endIndex
    });
    currentChars = [];
    currentStart = -1;
  }

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    const tag = normalize(child.tagName);
    if (tag !== 'mi') {
      flushRun(i - 1);
      continue;
    }

    const token = String(child.textContent || '').trim();
    if (/^[a-z]$/.test(token)) {
      if (!currentChars.length) {
        currentStart = i;
      }
      currentChars.push(token);
    } else {
      flushRun(i - 1);
    }
  }

  flushRun(children.length - 1);
  return runs;
}

function isApplyFunctionMo(node) {
  return normalize(node.tagName) === 'mo' && String(node.textContent || '').trim() === '\u2061';
}

function looksLikeNumericLiteral(value) {
  const text = String(value || '').trim();
  if (!text) {
    return false;
  }
  return /^[+-]?(?:\d+|\d+\.\d+|\d+,\d+|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+e[+-]?\d+)$/i.test(text);
}

export { runLint };

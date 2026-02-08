const SPEC_LINKS = {
  core: 'https://w3c.github.io/mathml-core/',
  intent: 'https://w3c.github.io/mathml/#intent-expressions',
  presentation: 'https://w3c.github.io/mathml/#presentation-markup',
  syntax: 'https://w3c.github.io/mathml/#fundamentals'
};

const GLOBAL_ATTRIBUTES = new Set([
  'class',
  'style',
  'id',
  'display',
  'mathvariant',
  'mathsize',
  'mathcolor',
  'dir',
  'href',
  'intent',
  'arg',
  'data-*'
]);

const TOKEN_ELEMENTS = new Set(['mi', 'mn', 'mo', 'mtext']);
const DEPRECATED_TAGS = new Set(['mfenced', 'mstyle']);

const CHILDREN_PRESENTATION = ['mrow', 'mi', 'mn', 'mo', 'mtext', 'mspace', 'mfrac', 'msup', 'msub', 'msubsup', 'msqrt', 'mroot', 'mtable', 'semantics'];

const TAG_RULES = {
  math: { children: [...CHILDREN_PRESENTATION], attributes: ['xmlns', 'display', 'intent'] },
  mrow: { children: [...CHILDREN_PRESENTATION, 'mrow'], attributes: ['intent'] },
  mi: { children: [], attributes: ['mathvariant', 'intent'] },
  mn: { children: [], attributes: ['intent'] },
  mo: { children: [], attributes: ['form', 'fence', 'separator', 'stretchy', 'symmetric', 'intent'] },
  mtext: { children: [], attributes: ['intent'] },
  mspace: { children: [], attributes: ['width', 'height', 'depth'] },
  mfrac: { children: [...CHILDREN_PRESENTATION], attributes: ['linethickness', 'bevelled', 'intent'], arity: { exact: 2 } },
  msup: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { exact: 2 } },
  msub: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { exact: 2 } },
  msubsup: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { exact: 3 } },
  msqrt: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'] },
  mroot: { children: [...CHILDREN_PRESENTATION], attributes: ['intent'], arity: { exact: 2 } },
  mfenced: { children: [...CHILDREN_PRESENTATION], attributes: ['open', 'close', 'separators', 'intent'] },
  mtable: { children: ['mtr', 'mlabeledtr'], attributes: ['columnalign', 'rowalign', 'intent'] },
  mtr: { children: ['mtd'], attributes: ['intent'] },
  mlabeledtr: { children: ['mtd'], attributes: ['intent'], arity: { min: 2 } },
  mtd: { children: [...CHILDREN_PRESENTATION], attributes: ['rowspan', 'columnspan', 'intent'] },
  semantics: { children: ['mrow', ...CHILDREN_PRESENTATION, 'annotation', 'annotation-xml'], attributes: ['intent'], arity: { min: 1 } },
  annotation: { children: [], attributes: ['encoding', 'src'] },
  'annotation-xml': { children: ['any'], attributes: ['encoding', 'src'] },
  mstyle: { children: ['any'], attributes: ['displaystyle', 'scriptlevel'] }
};

function runLint(mathmlSource, options = {}) {
  const source = String(mathmlSource || '');
  const findings = [];
  const profile = normalizeProfile(options.profile);

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
  }

  const allElements = [...doc.querySelectorAll('*')];
  for (const node of allElements) {
    validateTag(findings, node, profile);
    validateAttributes(findings, node);
    validateChildren(findings, node);
    validateArity(findings, node);
    validateTokenContent(findings, node);
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

function validateAttributes(findings, node) {
  const tag = normalize(node.tagName);
  const rule = TAG_RULES[tag];
  const allowed = new Set([...(rule?.attributes || []), ...GLOBAL_ATTRIBUTES]);

  for (const attr of [...node.attributes]) {
    const attrName = attr.name;
    if (attrName.startsWith('data-')) {
      continue;
    }

    if (!allowed.has(attrName)) {
      findings.push(makeFinding('warn', 'L020', 'Unknown attribute', `Attribute "${attrName}" is not recognized on <${tag}>.`, SPEC_LINKS.presentation));
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

function validateSemanticsHints(findings, node, profile) {
  if (profile === 'strict-core') {
    return;
  }

  const tag = normalize(node.tagName);

  if (tag === 'mrow' && node.children.length > 5 && !node.hasAttribute('intent')) {
    findings.push(makeFinding('info', 'L060', 'Semantics hint', 'Large <mrow> group has no intent. Consider intent for disambiguation.', SPEC_LINKS.intent));
  }

  if ((tag === 'mi' || tag === 'mn') && node.textContent.trim().length > 1 && !node.hasAttribute('intent')) {
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

export { runLint };

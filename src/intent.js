const W3C_INTENT_OVERVIEW = 'https://w3c.github.io/mathml/#intent-expressions';
const W3C_INTENT_MIXING = 'https://w3c.github.io/mathml/#mixing-intent-and-presentation';

function getIntentSuggestions(mathmlSource) {
  const source = mathmlSource || '';
  const suggestions = [];

  if (!source.trim()) {
    suggestions.push(makeSuggestion('info', 'No input', 'Add MathML to receive intent suggestions.', W3C_INTENT_OVERVIEW));
    return { sourceLength: source.length, suggestions };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'application/xml');
  const parseError = doc.querySelector('parsererror');

  if (parseError) {
    suggestions.push(makeSuggestion('warn', 'Intent analysis skipped', 'Intent suggestions require valid XML/MathML.', W3C_INTENT_OVERVIEW));
    return { sourceLength: source.length, suggestions };
  }

  const nodes = [...doc.querySelectorAll('*')];
  for (const node of nodes) {
    checkIntentSyntax(node, suggestions);
    checkGroupingIntent(node, suggestions);
    checkRelationIntent(node, suggestions);
    checkFunctionIntent(node, suggestions);
    checkPotentialOverIntent(node, suggestions);
  }

  if (!suggestions.length) {
    suggestions.push(makeSuggestion('ok', 'Intent looks reasonable', 'No obvious intent issues detected for current heuristics.', W3C_INTENT_OVERVIEW));
  }

  return {
    sourceLength: source.length,
    suggestions: dedupeSuggestions(suggestions)
  };
}

function checkIntentSyntax(node, suggestions) {
  if (!node.hasAttribute('intent')) {
    return;
  }

  const intent = node.getAttribute('intent').trim();
  if (!intent) {
    suggestions.push(makeSuggestion('warn', 'Empty intent', 'An empty intent attribute was found. Remove it or provide a valid intent expression.', W3C_INTENT_OVERVIEW));
    return;
  }

  if (/\s{2,}/.test(intent)) {
    suggestions.push(makeSuggestion('info', 'Intent formatting', 'Intent expression has repeated whitespace; normalize spacing for readability.', W3C_INTENT_OVERVIEW));
  }

  if (!/^[\w\s()_:\-*+,./]+$/.test(intent)) {
    suggestions.push(makeSuggestion('warn', 'Intent characters', 'Intent expression contains unusual characters that may not parse as expected.', W3C_INTENT_OVERVIEW));
  }
}

function checkGroupingIntent(node, suggestions) {
  const tag = normalize(node.tagName);
  if (tag !== 'mrow') {
    return;
  }

  if (node.children.length >= 3 && !node.hasAttribute('intent')) {
    suggestions.push(makeSuggestion('info', 'Grouped expression', 'This <mrow> groups multiple children. Consider intent if grouping is semantically significant.', W3C_INTENT_MIXING));
  }
}

function checkRelationIntent(node, suggestions) {
  const tag = normalize(node.tagName);
  if (tag !== 'mo') {
    return;
  }

  const op = node.textContent.trim();
  if (!['=', '<', '>', '≤', '≥'].includes(op)) {
    return;
  }

  const parent = node.parentElement;
  if (parent && normalize(parent.tagName) === 'mrow' && !parent.hasAttribute('intent')) {
    suggestions.push(makeSuggestion('info', 'Relational structure', 'Relation operator detected in <mrow>. Consider intent like "equation($lhs,$rhs)" when semantics matter.', W3C_INTENT_MIXING));
  }
}

function checkFunctionIntent(node, suggestions) {
  const tag = normalize(node.tagName);
  if (tag !== 'mfenced') {
    return;
  }

  if (!node.hasAttribute('intent')) {
    suggestions.push(makeSuggestion('info', 'Fenced structure', 'Fenced expression often encodes function application; consider explicit intent for function-call semantics.', W3C_INTENT_MIXING));
  }
}

function checkPotentialOverIntent(node, suggestions) {
  const tag = normalize(node.tagName);
  if (!node.hasAttribute('intent')) {
    return;
  }

  if ((tag === 'mi' || tag === 'mn') && node.textContent.trim().length <= 1) {
    suggestions.push(makeSuggestion('info', 'Check granularity', `Token-level intent on <${tag}> may be unnecessary unless disambiguation is needed.`, W3C_INTENT_MIXING));
  }
}

function makeSuggestion(severity, title, message, link) {
  return { severity, title, message, link };
}

function dedupeSuggestions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.severity}|${item.title}|${item.message}|${item.link}`;
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

export { getIntentSuggestions };

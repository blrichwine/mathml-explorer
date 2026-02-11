import { contentElements, presentationElements, universalAttributes } from './mathml-data-v3.js';

const PROVISIONAL_MATHML4_OVERLAYS = Object.freeze([
  {
    id: 'mathml4-intent-global',
    description: 'Allow "intent" across presentation elements for MathML3-based pipelines adopting MathML4 intent authoring.'
  }
]);

function normalizeSchemaTag(value) {
  return String(value || '').toLowerCase();
}

function dedupeValues(values) {
  return values.filter((value, index, arr) => arr.indexOf(value) === index);
}

function normalizeSchemaChildren(allowedChildren) {
  if (allowedChildren === 'any-content' || allowedChildren === 'any-xml') {
    return ['any'];
  }
  if (!Array.isArray(allowedChildren)) {
    return [];
  }
  return dedupeValues(
    allowedChildren
      .map((entry) => normalizeSchemaTag(entry))
      .filter((entry) => entry && entry !== 'text' && entry !== 'html-phrasing')
  );
}

function normalizeSchemaAttributes(allowedAttributes, options = {}) {
  const includeOnStarInAttributes = options.includeOnStarInAttributes !== false;
  if (!Array.isArray(allowedAttributes)) {
    return [];
  }
  return dedupeValues(
    allowedAttributes
      .map((entry) => normalizeSchemaTag(entry))
      .filter((entry) => entry && (includeOnStarInAttributes || entry !== 'on*'))
  );
}

function schemaChildCountToArity(childCount) {
  if (!childCount || typeof childCount !== 'object') {
    return null;
  }
  const min = Number.isFinite(childCount.min) ? childCount.min : null;
  const max = Number.isFinite(childCount.max) ? childCount.max : null;
  if (min === null && max === null) {
    return null;
  }
  if (min !== null && max !== null && min === max) {
    return { exact: min };
  }
  if (min !== null && min > 0) {
    return { min };
  }
  return null;
}

function createMathMLSchemaAdapter(options = {}) {
  const mathmlVersion = normalizeSchemaTag(options.mathmlVersion || 'mathml3');
  const presentationRules = {};
  for (const [rawTag, def] of Object.entries(presentationElements || {})) {
    const tag = normalizeSchemaTag(rawTag);
    let attributes = normalizeSchemaAttributes(def.allowedAttributes, options);
    if (mathmlVersion === 'mathml4' && !attributes.includes('intent')) {
      attributes = dedupeValues([...attributes, 'intent']);
    }
    presentationRules[tag] = {
      children: normalizeSchemaChildren(def.allowedChildren),
      attributes,
      arity: schemaChildCountToArity(def.childCount)
    };
  }

  const specsByTag = new Map();
  for (const [name, def] of Object.entries(presentationElements || {})) {
    specsByTag.set(
      normalizeSchemaTag(name),
      new Set((def.specs || []).map((entry) => normalizeSchemaTag(entry)))
    );
  }
  for (const [name, def] of Object.entries(contentElements || {})) {
    specsByTag.set(
      normalizeSchemaTag(name),
      new Set((def.specs || []).map((entry) => normalizeSchemaTag(entry)))
    );
  }

  const contentTags = new Set(Object.keys(contentElements || {}).map((name) => normalizeSchemaTag(name)));
  const knownTags = new Set([
    ...Object.keys(presentationRules),
    ...contentTags
  ]);

  return {
    mathmlVersion,
    provisionalOverlays: mathmlVersion === 'mathml4' ? PROVISIONAL_MATHML4_OVERLAYS : [],
    presentationRules,
    specsByTag,
    contentTags,
    knownTags,
    normalizedUniversalAttributes: (universalAttributes || []).map((entry) => normalizeSchemaTag(entry))
  };
}

function isAllowedAttributeName(attrName, allowedSet) {
  const normalized = normalizeSchemaTag(attrName);
  if (allowedSet.has(normalized)) {
    return true;
  }
  if (allowedSet.has('data-*') && /^data-/.test(normalized)) {
    return true;
  }
  if (allowedSet.has('on*') && /^on/.test(normalized)) {
    return true;
  }
  return false;
}

export {
  createMathMLSchemaAdapter,
  dedupeValues,
  isAllowedAttributeName,
  normalizeSchemaTag,
  PROVISIONAL_MATHML4_OVERLAYS
};

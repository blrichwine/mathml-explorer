const MATHML_SAMPLE = `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <msup>
      <mi>x</mi>
      <mn>2</mn>
    </msup>
    <mo>+</mo>
    <mn>1</mn>
  </mrow>
</math>`;

const GLOBAL_ATTRIBUTES = [
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
  'arg'
];

const MATHML_REFERENCE = {
  math: {
    children: ['mrow', 'mi', 'mn', 'mo', 'mfrac', 'msup', 'msub', 'msubsup', 'msqrt', 'mroot', 'mfenced', 'mtable', 'semantics'],
    attributes: ['xmlns', 'display', 'intent', 'altimg', 'alttext', 'altimg-width', 'altimg-height', 'altimg-valign']
  },
  mrow: {
    children: ['mi', 'mn', 'mo', 'mtext', 'mspace', 'mfrac', 'msup', 'msub', 'msubsup', 'msqrt', 'mroot', 'mfenced', 'mtable'],
    attributes: ['intent']
  },
  mi: {
    children: ['text'],
    attributes: ['mathvariant', 'intent']
  },
  mn: {
    children: ['text'],
    attributes: ['intent']
  },
  mo: {
    children: ['text'],
    attributes: ['form', 'fence', 'separator', 'stretchy', 'symmetric', 'intent']
  },
  mtext: {
    children: ['text'],
    attributes: ['intent']
  },
  mspace: {
    children: [],
    attributes: ['width', 'height', 'depth']
  },
  mfrac: {
    children: ['numerator', 'denominator'],
    attributes: ['linethickness', 'bevelled', 'intent']
  },
  msup: {
    children: ['base', 'superscript'],
    attributes: ['intent']
  },
  msub: {
    children: ['base', 'subscript'],
    attributes: ['intent']
  },
  msubsup: {
    children: ['base', 'subscript', 'superscript'],
    attributes: ['intent']
  },
  msqrt: {
    children: ['mrow', 'mi', 'mn', 'mo', 'mfrac', 'msup', 'msub', 'msubsup'],
    attributes: ['intent']
  },
  mroot: {
    children: ['base', 'index'],
    attributes: ['intent']
  },
  mfenced: {
    children: ['mrow', 'mi', 'mn', 'mo', 'mfrac', 'msup', 'msub', 'msubsup'],
    attributes: ['open', 'close', 'separators', 'intent']
  },
  mtable: {
    children: ['mtr', 'mlabeledtr'],
    attributes: ['columnalign', 'rowalign', 'intent']
  },
  mtr: {
    children: ['mtd'],
    attributes: ['intent']
  },
  mlabeledtr: {
    children: ['mtd'],
    attributes: ['intent']
  },
  mtd: {
    children: ['mrow', 'mi', 'mn', 'mo', 'mfrac', 'msup', 'msub', 'msubsup'],
    attributes: ['rowspan', 'columnspan', 'intent']
  },
  semantics: {
    children: ['mrow', 'annotation', 'annotation-xml'],
    attributes: ['intent']
  },
  annotation: {
    children: ['text'],
    attributes: ['encoding', 'src']
  },
  'annotation-xml': {
    children: ['any'],
    attributes: ['encoding', 'src']
  }
};

function createEditorController(store, bus) {
  const aInput = document.querySelector('#mathml-a-input');
  const bInput = document.querySelector('#mathml-b-input');
  const aHighlight = document.querySelector('#mathml-a-highlight');
  const bHighlight = document.querySelector('#mathml-b-highlight');
  const aWarnings = document.querySelector('#mathml-a-warnings');
  const bWarnings = document.querySelector('#mathml-b-warnings');
  const contextSummary = document.querySelector('#context-summary');
  const childList = document.querySelector('#context-children-list');
  const attrList = document.querySelector('#context-attributes-list');
  const formatAButton = document.querySelector('#format-a-button');
  const formatBButton = document.querySelector('#format-b-button');
  const expandAButton = document.querySelector('#expand-a-button');
  const expandBButton = document.querySelector('#expand-b-button');
  const modalBackdrop = document.querySelector('#editor-modal-backdrop');
  const modalClose = document.querySelector('#editor-modal-close');
  const modalFormat = document.querySelector('#editor-modal-format');
  const modalInput = document.querySelector('#editor-modal-input');
  const modalTitle = document.querySelector('#editor-modal-title');

  initializeInputs(store, aInput, bInput);
  const modalState = { activeKey: '' };

  const editorMap = {
    A: { input: aInput, highlight: aHighlight, warnings: aWarnings },
    B: { input: bInput, highlight: bHighlight, warnings: bWarnings }
  };

  for (const key of ['A', 'B']) {
    const editor = editorMap[key];
    editor.input.addEventListener('input', () => {
      const nextValue = editor.input.value;
      store.setState((draft) => {
        draft.selectedExpression = key;
        if (key === 'A') {
          draft.mathmlA = nextValue;
        } else {
          draft.mathmlB = nextValue;
        }
      });
    });

    editor.input.addEventListener('click', () => updateContextForEditor(key, store, editor, contextSummary, childList, attrList));
    editor.input.addEventListener('keyup', () => updateContextForEditor(key, store, editor, contextSummary, childList, attrList));
    editor.input.addEventListener('scroll', () => syncHighlightScroll(editor));
    editor.input.addEventListener('focus', () => {
      store.setState((draft) => {
        draft.selectedExpression = key;
      });
      updateContextForEditor(key, store, editor, contextSummary, childList, attrList);
    });
  }

  formatAButton.addEventListener('click', () => {
    applyFormattedMathML('A', store);
  });

  formatBButton.addEventListener('click', () => {
    applyFormattedMathML('B', store);
  });

  expandAButton.addEventListener('click', () => openEditorModal('A', store, modalState, modalBackdrop, modalInput, modalTitle));
  expandBButton.addEventListener('click', () => openEditorModal('B', store, modalState, modalBackdrop, modalInput, modalTitle));

  modalClose.addEventListener('click', () => closeEditorModal(modalState, modalBackdrop));
  modalFormat.addEventListener('click', () => {
    if (!modalState.activeKey) {
      return;
    }

    const formatted = formatMathML(modalInput.value);
    if (formatted.error) {
      return;
    }

    modalInput.value = formatted.value;
    store.setState((draft) => {
      draft.selectedExpression = modalState.activeKey;
      if (modalState.activeKey === 'A') {
        draft.mathmlA = formatted.value;
      } else {
        draft.mathmlB = formatted.value;
      }
    });
  });
  modalBackdrop.addEventListener('click', (event) => {
    if (event.target === modalBackdrop) {
      closeEditorModal(modalState, modalBackdrop);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalState.activeKey) {
      closeEditorModal(modalState, modalBackdrop);
    }
  });

  modalInput.addEventListener('input', () => {
    if (!modalState.activeKey) {
      return;
    }

    const nextValue = modalInput.value;
    store.setState((draft) => {
      draft.selectedExpression = modalState.activeKey;
      if (modalState.activeKey === 'A') {
        draft.mathmlA = nextValue;
      } else {
        draft.mathmlB = nextValue;
      }
    });
  });

  bus.on('state:changed', (state) => {
    syncEditor('A', state.mathmlA, editorMap.A);
    syncEditor('B', state.mathmlB, editorMap.B);
    renderWarnings(aWarnings, collectWarnings(state.mathmlA));
    renderWarnings(bWarnings, collectWarnings(state.mathmlB));

    const activeKey = state.selectedExpression === 'B' ? 'B' : 'A';
    updateContextForEditor(activeKey, store, editorMap[activeKey], contextSummary, childList, attrList);

    if (modalState.activeKey === 'A' && modalInput.value !== state.mathmlA) {
      modalInput.value = state.mathmlA;
    }
    if (modalState.activeKey === 'B' && modalInput.value !== state.mathmlB) {
      modalInput.value = state.mathmlB;
    }
  });
}

function openEditorModal(expressionKey, store, modalState, modalBackdrop, modalInput, modalTitle) {
  modalState.activeKey = expressionKey;
  const state = store.getState();
  modalTitle.textContent = `Edit MathML ${expressionKey}`;
  modalInput.value = expressionKey === 'A' ? state.mathmlA : state.mathmlB;
  modalBackdrop.classList.remove('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => modalInput.focus(), 0);
}

function closeEditorModal(modalState, modalBackdrop) {
  modalState.activeKey = '';
  modalBackdrop.classList.add('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'true');
}

function initializeInputs(store, aInput, bInput) {
  const { mathmlA, mathmlB } = store.getState();
  aInput.value = mathmlA || MATHML_SAMPLE;
  bInput.value = mathmlB || MATHML_SAMPLE;

  if (!mathmlA || !mathmlB) {
    store.setState((draft) => {
      if (!draft.mathmlA) {
        draft.mathmlA = MATHML_SAMPLE;
      }
      if (!draft.mathmlB) {
        draft.mathmlB = MATHML_SAMPLE;
      }
    });
  }
}

function syncEditor(key, source, editor) {
  if (editor.input.value !== source) {
    editor.input.value = source;
  }
  editor.highlight.innerHTML = buildSyntaxHighlightedHtml(source);
  editor.input.dataset.expression = key;
  syncHighlightScroll(editor);
}

function syncHighlightScroll(editor) {
  editor.highlight.scrollTop = editor.input.scrollTop;
  editor.highlight.scrollLeft = editor.input.scrollLeft;
}

function applyFormattedMathML(expressionKey, store) {
  const source = expressionKey === 'A' ? store.getState().mathmlA : store.getState().mathmlB;
  const formatted = formatMathML(source);

  if (formatted.error) {
    return;
  }

  store.setState((draft) => {
    if (expressionKey === 'A') {
      draft.mathmlA = formatted.value;
    } else {
      draft.mathmlB = formatted.value;
    }
  });
}

function formatMathML(source) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(source, 'application/xml');
  const parseError = xmlDoc.querySelector('parsererror');

  if (parseError) {
    return { error: parseError.textContent || 'Unable to format invalid MathML.' };
  }

  const root = xmlDoc.documentElement;
  const lines = [];
  serializeNode(root, 0, lines);
  return { value: lines.join('\n') };
}

function serializeNode(node, depth, lines) {
  const indent = '  '.repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    if (text) {
      lines.push(`${indent}${text}`);
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const tag = node.tagName;
  const attributes = [...node.attributes].map((attr) => `${attr.name}="${escapeAttribute(attr.value)}"`).join(' ');
  const openTag = attributes ? `<${tag} ${attributes}>` : `<${tag}>`;

  if (node.childNodes.length === 0) {
    lines.push(`${indent}${openTag.replace(/>$/, ' />')}`);
    return;
  }

  const nonWhitespaceChildren = [...node.childNodes].filter((child) => {
    return child.nodeType !== Node.TEXT_NODE || child.textContent.trim() !== '';
  });

  if (nonWhitespaceChildren.length === 1 && nonWhitespaceChildren[0].nodeType === Node.TEXT_NODE) {
    lines.push(`${indent}${openTag}${escapeText(nonWhitespaceChildren[0].textContent.trim())}</${tag}>`);
    return;
  }

  lines.push(`${indent}${openTag}`);
  for (const child of nonWhitespaceChildren) {
    serializeNode(child, depth + 1, lines);
  }
  lines.push(`${indent}</${tag}>`);
}

function escapeAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSyntaxHighlightedHtml(source) {
  const escaped = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[a-zA-Z][\w:-]*)([^&]*?)(&gt;)/g, (match, comment, tagOpen, attributeChunk, tagClose) => {
    if (comment) {
      return `<span class="token-comment">${comment}</span>`;
    }

    const highlightedAttributes = attributeChunk.replace(/([a-zA-Z_:][\w:.-]*)(\s*=\s*)"([^"]*)"/g, (_, attrName, equalSign, attrValue) => {
      return `<span class="token-attr-name">${attrName}</span>${equalSign}<span class="token-attr-value">"${attrValue}"</span>`;
    });

    return `<span class="token-tag">${tagOpen}</span>${highlightedAttributes}<span class="token-tag">${tagClose}</span>`;
  });
}

function collectWarnings(source) {
  const warnings = [];

  if (!source.trim()) {
    return [{ type: 'info', message: 'Editor is empty.' }];
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(source, 'application/xml');
  const parseError = xmlDoc.querySelector('parsererror');

  if (parseError) {
    warnings.push({ type: 'error', message: parseError.textContent || 'Invalid XML/MathML syntax.' });
    return warnings;
  }

  const discoveredTags = [...source.matchAll(/<\/?\s*([a-zA-Z][\w:-]*)/g)].map((match) => normalizeTag(match[1]));
  const knownTags = new Set(Object.keys(MATHML_REFERENCE));

  for (const tag of discoveredTags) {
    if (!knownTags.has(tag)) {
      warnings.push({ type: 'warn', message: `Unknown MathML tag: <${tag}>` });
    }
  }

  const openTagRegex = /<([a-zA-Z][\w:-]*)([^>]*)>/g;
  for (const match of source.matchAll(openTagRegex)) {
    const rawTag = normalizeTag(match[1]);
    if (match[0].startsWith('</')) {
      continue;
    }

    const attrChunk = match[2] || '';
    const attributes = [...attrChunk.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*"([^"]*)"/g)].map((attrMatch) => attrMatch[1]);
    const allowed = new Set([...(MATHML_REFERENCE[rawTag]?.attributes || []), ...GLOBAL_ATTRIBUTES]);

    for (const attr of attributes) {
      if (!allowed.has(attr)) {
        warnings.push({ type: 'warn', message: `Unknown attribute "${attr}" on <${rawTag}>.` });
      }
    }
  }

  if (warnings.length === 0) {
    warnings.push({ type: 'ok', message: 'No syntax or reference warnings detected.' });
  }

  return dedupeWarnings(warnings);
}

function dedupeWarnings(warnings) {
  const seen = new Set();
  return warnings.filter((entry) => {
    const key = `${entry.type}:${entry.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function renderWarnings(listElement, warnings) {
  listElement.innerHTML = '';
  for (const warning of warnings) {
    const li = document.createElement('li');
    li.className = `warning-${warning.type}`;
    li.textContent = warning.message;
    listElement.append(li);
  }
}

function updateContextForEditor(key, store, editor, contextSummary, childList, attrList) {
  const source = key === 'A' ? store.getState().mathmlA : store.getState().mathmlB;
  const cursor = editor.input.selectionStart || 0;
  const currentTag = findCurrentTagAtCursor(source, cursor);

  contextSummary.textContent = currentTag
    ? `Expression ${key}: cursor is inside <${currentTag}>.`
    : `Expression ${key}: cursor is not inside a recognized tag.`;

  childList.innerHTML = '';
  attrList.innerHTML = '';

  if (!currentTag || !MATHML_REFERENCE[currentTag]) {
    appendListItem(childList, 'No tag-specific child help available.');
    appendListItem(attrList, 'No tag-specific attribute help available.');
    return;
  }

  const entry = MATHML_REFERENCE[currentTag];

  if (entry.children.length === 0) {
    appendListItem(childList, 'No child elements allowed.');
  } else {
    for (const child of entry.children) {
      appendListItem(childList, `<${child}>`);
    }
  }

  const attrs = [...entry.attributes, ...GLOBAL_ATTRIBUTES].filter((value, index, arr) => arr.indexOf(value) === index);
  for (const attr of attrs) {
    appendListItem(attrList, attr);
  }
}

function appendListItem(list, text) {
  const li = document.createElement('li');
  li.textContent = text;
  list.append(li);
}

function findCurrentTagAtCursor(source, cursor) {
  const stack = [];
  const beforeCursor = source.slice(0, cursor);
  const tagRegex = /<\s*(\/)?\s*([a-zA-Z][\w:-]*)([^>]*)>/g;

  for (const match of beforeCursor.matchAll(tagRegex)) {
    const isClosing = Boolean(match[1]);
    const tag = normalizeTag(match[2]);
    const raw = match[0];
    const selfClosing = /\/\s*>$/.test(raw);

    if (isClosing) {
      while (stack.length && stack[stack.length - 1] !== tag) {
        stack.pop();
      }
      if (stack.length && stack[stack.length - 1] === tag) {
        stack.pop();
      }
    } else if (!selfClosing) {
      stack.push(tag);
    }
  }

  return stack.length ? stack[stack.length - 1] : '';
}

function normalizeTag(tagName) {
  return tagName.trim().toLowerCase();
}

export { createEditorController, formatMathML };

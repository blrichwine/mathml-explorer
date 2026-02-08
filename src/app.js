import { createEditorController } from './editor.js';
import { runLint } from './lint.js';
import { getIntentSuggestions } from './intent.js';
import { diffOutputs } from './diff.js';
import { convertLatexToMathML } from './latex.js';
import { loadNimasFromDirectory, loadNimasFromFile } from './nimas.js';
import { loadEpubFromDirectory, loadEpubFromFile } from './epub.js';
import {
  exportStateToJson,
  hydrateState,
  hydrateStateFromQuery,
  importStateFromJson,
  persistState,
  serializeShareState,
  toShareUrl
} from './persistence.js';
import {
  createDefaultOutputsState,
  ensureAccessibilityEngines,
  generateAccessibilityOutputs,
  getAccessibilityChannels,
  renderAccessibilityPanels
} from './accessibility.js';

const MATHJAX_VERSIONS = [
  {
    id: '2.7.9',
    label: 'MathJax 2.7.9',
    major: 2,
    cdnByMode: {
      chtml: 'https://cdn.jsdelivr.net/npm/mathjax@2.7.9/MathJax.js?config=TeX-CHTML-full',
      svg: 'https://cdn.jsdelivr.net/npm/mathjax@2.7.9/MathJax.js?config=TeX-SVG-full'
    }
  },
  {
    id: '3.2.2',
    label: 'MathJax 3.2.2',
    major: 3,
    cdnByMode: {
      chtml: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml.js',
      svg: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'
    }
  },
  {
    id: '4.0.0',
    label: 'MathJax 4.0.0',
    major: 4,
    cdnByMode: {
      chtml: 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js',
      svg: 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js'
    }
  }
];

const STORAGE_KEY = 'mathml-workbench-state-v1';
const MATHJAX_SCRIPT_ID = 'mathjax-runtime-script';

let mathJaxRuntime = {
  loadedKey: '',
  loadId: 0
};

function createInitialState() {
  return {
    schemaVersion: 1,
    mathmlA: '',
    mathmlB: '',
    latexSetup: '',
    latexInput: '',
    selectedExpression: 'A',
    mathjax: {
      versionId: MATHJAX_VERSIONS[0].id,
      outputMode: 'chtml',
      loadState: 'idle',
      loadMessage: 'MathJax not loaded yet.'
    },
    outputs: {
      ...createDefaultOutputsState()
    },
    lintFindings: {
      A: [],
      B: []
    },
    lintProfile: 'authoring-guidance',
    ignoreDataMjxAttributes: true,
    intentSuggestions: {
      A: [],
      B: []
    },
    diff: {
      channelId: 'mathcatClearspeak',
      viewMode: 'unified'
    },
    latexTarget: 'A',
    nimas: {
      sourceLabel: '',
      status: 'No NIMAS source loaded yet.',
      statusLevel: 'idle',
      instances: [],
      selectedIndex: -1,
      target: 'A'
    },
    epub: {
      sourceLabel: '',
      status: 'No EPUB source loaded yet.',
      statusLevel: 'idle',
      instances: [],
      selectedIndex: -1,
      target: 'A'
    },
    meta: {
      lastUpdated: new Date().toISOString()
    }
  };
}

function createEventBus() {
  const listeners = new Map();

  function on(eventName, handler) {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(handler);
    return () => listeners.get(eventName)?.delete(handler);
  }

  function emit(eventName, payload) {
    for (const handler of listeners.get(eventName) || []) {
      handler(payload);
    }
  }

  return { on, emit };
}

function createStore(initialState, eventBus) {
  let state = structuredClone(initialState);

  function getState() {
    return state;
  }

  function setState(mutator) {
    const nextState = structuredClone(state);
    mutator(nextState);
    nextState.meta.lastUpdated = new Date().toISOString();
    state = nextState;
    eventBus.emit('state:changed', state);
  }

  return { getState, setState };
}

function populateMathJaxVersions(selectEl) {
  for (const version of MATHJAX_VERSIONS) {
    const option = document.createElement('option');
    option.value = version.id;
    option.textContent = version.label;
    selectEl.append(option);
  }
}

function wireControls(store) {
  const versionSelect = document.querySelector('#mathjax-version-select');
  const modeSelect = document.querySelector('#mathjax-output-mode-select');
  const lintProfileSelect = document.querySelector('#lint-profile-select');
  const ignoreDataMjxToggle = document.querySelector('#ignore-data-mjx-toggle');
  const diffChannelSelect = document.querySelector('#diff-channel-select');
  const diffViewSelect = document.querySelector('#diff-view-select');
  const shareButton = document.querySelector('#share-url-button');
  const saveButton = document.querySelector('#save-json-button');
  const loadButton = document.querySelector('#load-json-button');
  const loadInput = document.querySelector('#load-json-input');
  const latexSetupInput = document.querySelector('#latex-setup-input');
  const latexInput = document.querySelector('#latex-input');
  const latexTargetSelect = document.querySelector('#latex-target-select');
  const convertLatexButton = document.querySelector('#convert-latex-button');
  const nimasLoadFolderButton = document.querySelector('#nimas-load-folder-button');
  const nimasLoadFileButton = document.querySelector('#nimas-load-file-button');
  const nimasFileInput = document.querySelector('#nimas-file-input');
  const nimasInstanceSelect = document.querySelector('#nimas-instance-select');
  const nimasTargetSelect = document.querySelector('#nimas-target-select');
  const nimasImportButton = document.querySelector('#nimas-import-button');
  const nimasImagePreview = document.querySelector('#nimas-image-preview');
  const epubLoadFolderButton = document.querySelector('#epub-load-folder-button');
  const epubLoadFileButton = document.querySelector('#epub-load-file-button');
  const epubFileInput = document.querySelector('#epub-file-input');
  const epubInstanceSelect = document.querySelector('#epub-instance-select');
  const epubTargetSelect = document.querySelector('#epub-target-select');
  const epubImportButton = document.querySelector('#epub-import-button');
  const epubImagePreview = document.querySelector('#epub-image-preview');
  const nimasImageModalBackdrop = document.querySelector('#nimas-image-modal-backdrop');
  const nimasImageModalClose = document.querySelector('#nimas-image-modal-close');
  const nimasImageModalTitle = document.querySelector('#nimas-image-modal-title');
  const nimasImageModalView = document.querySelector('#nimas-image-modal-view');
  const nimasImageZoomRange = document.querySelector('#nimas-image-zoom-range');
  const nimasImageZoomValue = document.querySelector('#nimas-image-zoom-value');

  populateMathJaxVersions(versionSelect);
  populateDiffChannels(diffChannelSelect);

  versionSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.mathjax.versionId = versionSelect.value;
    });
  });

  modeSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.mathjax.outputMode = modeSelect.value;
    });
  });

  lintProfileSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.lintProfile = lintProfileSelect.value;
    });
  });

  ignoreDataMjxToggle.addEventListener('change', () => {
    store.setState((draft) => {
      draft.ignoreDataMjxAttributes = Boolean(ignoreDataMjxToggle.checked);
    });
  });

  diffChannelSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.diff.channelId = diffChannelSelect.value;
    });
  });

  diffViewSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.diff.viewMode = diffViewSelect.value;
    });
  });

  shareButton.addEventListener('click', async () => {
    const shareUrl = toShareUrl(store.getState());
    try {
      await navigator.clipboard.writeText(shareUrl);
      setPersistenceStatus('Share URL copied to clipboard.', 'ready');
    } catch {
      setPersistenceStatus('Clipboard write failed. Copy this URL manually from the status panel.', 'warn');
    }
  });

  saveButton.addEventListener('click', () => {
    const state = store.getState();
    const json = exportStateToJson(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mathml-workbench-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setPersistenceStatus('State exported as JSON.', 'ready');
  });

  loadButton.addEventListener('click', () => {
    loadInput.click();
  });

  loadInput.addEventListener('change', async () => {
    const file = loadInput.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const imported = importStateFromJson(text, createInitialState());
      store.setState((draft) => {
        Object.assign(draft, imported);
      });
      setPersistenceStatus(`Loaded state from ${file.name}.`, 'ready');
    } catch {
      setPersistenceStatus(`Could not load ${file.name}. Ensure it is valid JSON from this tool.`, 'error');
    }

    loadInput.value = '';
  });

  latexSetupInput.addEventListener('input', () => {
    store.setState((draft) => {
      draft.latexSetup = latexSetupInput.value;
    });
  });

  latexInput.addEventListener('input', () => {
    store.setState((draft) => {
      draft.latexInput = latexInput.value;
    });
  });

  latexTargetSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.latexTarget = latexTargetSelect.value;
    });
  });

  convertLatexButton.addEventListener('click', async () => {
    const state = store.getState();
    const version = MATHJAX_VERSIONS.find((entry) => entry.id === state.mathjax.versionId);

    setLatexStatus('Converting LaTeX to MathML...', 'loading');
    convertLatexButton.disabled = true;
    try {
      const result = await convertLatexToMathML({
        latexSetup: state.latexSetup,
        latexInput: state.latexInput,
        mathjaxVersion: version,
        outputMode: state.mathjax.outputMode
      });

      if (!result.ok) {
        setLatexStatus(result.error || 'LaTeX conversion failed.', 'error');
        return;
      }

      store.setState((draft) => {
        if (draft.latexTarget === 'B') {
          draft.mathmlB = result.mathml;
          draft.selectedExpression = 'B';
        } else {
          draft.mathmlA = result.mathml;
          draft.selectedExpression = 'A';
        }
      });

      const packageHint = result.packages?.length ? ` Packages: ${result.packages.join(', ')}.` : '';
      setLatexStatus(`LaTeX converted and inserted into MathML ${state.latexTarget}.${packageHint}`, 'ready');
      renderLatexPreview(result.mathml);
    } catch (error) {
      setLatexStatus(`LaTeX conversion failed: ${error.message}`, 'error');
    } finally {
      convertLatexButton.disabled = false;
    }
  });

  nimasLoadFolderButton.addEventListener('click', async () => {
    store.setState((draft) => {
      draft.nimas.status = 'Loading NIMAS folder...';
      draft.nimas.statusLevel = 'loading';
    });
    try {
      const loaded = await loadNimasFromDirectory();
      store.setState((draft) => {
        draft.nimas.sourceLabel = loaded.sourceLabel;
        draft.nimas.status = `Loaded ${loaded.instances.length} MathML instance(s) from ${loaded.sourceLabel}.`;
        draft.nimas.statusLevel = loaded.instances.length ? 'ready' : 'warn';
        draft.nimas.instances = loaded.instances;
        draft.nimas.selectedIndex = loaded.instances.length ? 0 : -1;
      });
    } catch (error) {
      store.setState((draft) => {
        draft.nimas.status = `NIMAS folder load failed: ${error.message}`;
        draft.nimas.statusLevel = 'error';
        draft.nimas.instances = [];
        draft.nimas.selectedIndex = -1;
      });
    }
  });

  nimasLoadFileButton.addEventListener('click', () => {
    nimasFileInput.click();
  });

  nimasFileInput.addEventListener('change', async () => {
    const file = nimasFileInput.files?.[0];
    if (!file) {
      return;
    }

    store.setState((draft) => {
      draft.nimas.status = `Loading ${file.name}...`;
      draft.nimas.statusLevel = 'loading';
    });
    try {
      const loaded = await loadNimasFromFile(file);
      store.setState((draft) => {
        draft.nimas.sourceLabel = loaded.sourceLabel;
        draft.nimas.status = `Loaded ${loaded.instances.length} MathML instance(s) from ${loaded.sourceLabel}.`;
        draft.nimas.statusLevel = loaded.instances.length ? 'ready' : 'warn';
        draft.nimas.instances = loaded.instances;
        draft.nimas.selectedIndex = loaded.instances.length ? 0 : -1;
      });
    } catch (error) {
      store.setState((draft) => {
        draft.nimas.status = `NIMAS XML load failed: ${error.message}`;
        draft.nimas.statusLevel = 'error';
        draft.nimas.instances = [];
        draft.nimas.selectedIndex = -1;
      });
    } finally {
      nimasFileInput.value = '';
    }
  });

  nimasInstanceSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.nimas.selectedIndex = Number(nimasInstanceSelect.value);
    });
  });

  nimasTargetSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.nimas.target = nimasTargetSelect.value;
    });
  });

  nimasImportButton.addEventListener('click', () => {
    const state = store.getState();
    const index = state.nimas.selectedIndex;
    let selected = null;
    if (index >= 0) {
      selected = state.nimas.instances.find((entry) => entry.index === index) || null;
    }
    if (!selected) {
      selected = state.nimas.instances[0] || null;
    }

    if (!selected) {
      store.setState((draft) => {
        draft.nimas.status = 'No MathML instance selected.';
        draft.nimas.statusLevel = 'warn';
      });
      return;
    }

    store.setState((draft) => {
      if (draft.nimas.target === 'B') {
        draft.mathmlB = selected.mathml;
        draft.selectedExpression = 'B';
      } else {
        draft.mathmlA = selected.mathml;
        draft.selectedExpression = 'A';
      }
      draft.nimas.status = `Imported ${selected.id} into MathML ${draft.nimas.target}.`;
      draft.nimas.statusLevel = 'ready';
    });
  });

  epubLoadFolderButton.addEventListener('click', async () => {
    store.setState((draft) => {
      draft.epub.status = 'Loading EPUB folder...';
      draft.epub.statusLevel = 'loading';
    });

    try {
      const loaded = await loadEpubFromDirectory();
      store.setState((draft) => {
        draft.epub.sourceLabel = loaded.sourceLabel;
        draft.epub.status = `Loaded ${loaded.instances.length} MathML instance(s) from ${loaded.sourceLabel}.`;
        draft.epub.statusLevel = loaded.instances.length ? 'ready' : 'warn';
        draft.epub.instances = loaded.instances;
        draft.epub.selectedIndex = loaded.instances.length ? 0 : -1;
      });
    } catch (error) {
      store.setState((draft) => {
        draft.epub.status = `EPUB folder load failed: ${error.message}`;
        draft.epub.statusLevel = 'error';
        draft.epub.instances = [];
        draft.epub.selectedIndex = -1;
      });
    }
  });

  epubLoadFileButton.addEventListener('click', () => {
    epubFileInput.click();
  });

  epubFileInput.addEventListener('change', async () => {
    const file = epubFileInput.files?.[0];
    if (!file) {
      return;
    }

    store.setState((draft) => {
      draft.epub.status = `Loading ${file.name}...`;
      draft.epub.statusLevel = 'loading';
    });
    try {
      const loaded = await loadEpubFromFile(file);
      store.setState((draft) => {
        draft.epub.sourceLabel = loaded.sourceLabel;
        draft.epub.status = `Loaded ${loaded.instances.length} MathML instance(s) from ${loaded.sourceLabel}.`;
        draft.epub.statusLevel = loaded.instances.length ? 'ready' : 'warn';
        draft.epub.instances = loaded.instances;
        draft.epub.selectedIndex = loaded.instances.length ? 0 : -1;
      });
    } catch (error) {
      store.setState((draft) => {
        draft.epub.status = `EPUB load failed: ${error.message}`;
        draft.epub.statusLevel = 'error';
        draft.epub.instances = [];
        draft.epub.selectedIndex = -1;
      });
    } finally {
      epubFileInput.value = '';
    }
  });

  epubInstanceSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.epub.selectedIndex = Number(epubInstanceSelect.value);
    });
  });

  epubTargetSelect.addEventListener('change', () => {
    store.setState((draft) => {
      draft.epub.target = epubTargetSelect.value;
    });
  });

  epubImportButton.addEventListener('click', () => {
    const state = store.getState();
    const index = state.epub.selectedIndex;
    let selected = null;
    if (index >= 0) {
      selected = state.epub.instances.find((entry) => entry.index === index) || null;
    }
    if (!selected) {
      selected = state.epub.instances[0] || null;
    }

    if (!selected) {
      store.setState((draft) => {
        draft.epub.status = 'No MathML instance selected.';
        draft.epub.statusLevel = 'warn';
      });
      return;
    }

    store.setState((draft) => {
      if (draft.epub.target === 'B') {
        draft.mathmlB = selected.mathml;
        draft.selectedExpression = 'B';
      } else {
        draft.mathmlA = selected.mathml;
        draft.selectedExpression = 'A';
      }
      draft.epub.status = `Imported ${selected.id} into MathML ${draft.epub.target}.`;
      draft.epub.statusLevel = 'ready';
    });
  });

  nimasImagePreview.addEventListener('click', () => {
    if (!nimasImagePreview.src || nimasImagePreview.classList.contains('hidden')) {
      return;
    }
    openNimasImageModal(
      nimasImageModalBackdrop,
      nimasImageModalTitle,
      nimasImageModalView,
      nimasImageZoomRange,
      nimasImageZoomValue,
      nimasImagePreview.src,
      nimasImagePreview.alt,
      'NIMAS Linked Image'
    );
  });

  epubImagePreview.addEventListener('click', () => {
    if (!epubImagePreview.src || epubImagePreview.classList.contains('hidden')) {
      return;
    }
    openNimasImageModal(
      nimasImageModalBackdrop,
      nimasImageModalTitle,
      nimasImageModalView,
      nimasImageZoomRange,
      nimasImageZoomValue,
      epubImagePreview.src,
      epubImagePreview.alt,
      'EPUB Linked Image'
    );
  });

  nimasImageModalClose.addEventListener('click', () => {
    closeNimasImageModal(nimasImageModalBackdrop, nimasImageModalView, nimasImageZoomRange, nimasImageZoomValue);
  });

  nimasImageModalBackdrop.addEventListener('click', (event) => {
    if (event.target === nimasImageModalBackdrop) {
      closeNimasImageModal(nimasImageModalBackdrop, nimasImageModalView, nimasImageZoomRange, nimasImageZoomValue);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !nimasImageModalBackdrop.classList.contains('hidden')) {
      closeNimasImageModal(nimasImageModalBackdrop, nimasImageModalView, nimasImageZoomRange, nimasImageZoomValue);
    }
  });

  nimasImageModalView.addEventListener('load', () => {
    const naturalWidth = nimasImageModalView.naturalWidth || 0;
    nimasImageModalView.dataset.naturalWidth = String(naturalWidth);
    applyNimasImageZoom(nimasImageModalView, nimasImageZoomRange, nimasImageZoomValue);
  });

  nimasImageZoomRange.addEventListener('input', () => {
    applyNimasImageZoom(nimasImageModalView, nimasImageZoomRange, nimasImageZoomValue);
  });

  const current = store.getState();
  versionSelect.value = current.mathjax.versionId;
  modeSelect.value = current.mathjax.outputMode;
  lintProfileSelect.value = current.lintProfile || 'authoring-guidance';
  ignoreDataMjxToggle.checked = Boolean(current.ignoreDataMjxAttributes);
  diffChannelSelect.value = current.diff.channelId;
  if (!diffChannelSelect.value && diffChannelSelect.options.length > 0) {
    diffChannelSelect.value = diffChannelSelect.options[0].value;
    store.setState((draft) => {
      draft.diff.channelId = diffChannelSelect.value;
    });
  }
  diffViewSelect.value = current.diff.viewMode;
  latexSetupInput.value = current.latexSetup;
  latexInput.value = current.latexInput;
  latexTargetSelect.value = current.latexTarget || 'A';
  nimasTargetSelect.value = current.nimas?.target || 'A';
  epubTargetSelect.value = current.epub?.target || 'A';
}

function syncControlValues(state) {
  const versionSelect = document.querySelector('#mathjax-version-select');
  const modeSelect = document.querySelector('#mathjax-output-mode-select');
  const lintProfileSelect = document.querySelector('#lint-profile-select');
  const ignoreDataMjxToggle = document.querySelector('#ignore-data-mjx-toggle');
  const diffChannelSelect = document.querySelector('#diff-channel-select');
  const diffViewSelect = document.querySelector('#diff-view-select');
  const latexSetupInput = document.querySelector('#latex-setup-input');
  const latexInput = document.querySelector('#latex-input');
  const latexTargetSelect = document.querySelector('#latex-target-select');
  const nimasTargetSelect = document.querySelector('#nimas-target-select');
  const epubTargetSelect = document.querySelector('#epub-target-select');

  if (versionSelect.value !== state.mathjax.versionId) {
    versionSelect.value = state.mathjax.versionId;
  }
  if (modeSelect.value !== state.mathjax.outputMode) {
    modeSelect.value = state.mathjax.outputMode;
  }
  if (lintProfileSelect.value !== (state.lintProfile || 'authoring-guidance')) {
    lintProfileSelect.value = state.lintProfile || 'authoring-guidance';
  }
  if (ignoreDataMjxToggle.checked !== Boolean(state.ignoreDataMjxAttributes)) {
    ignoreDataMjxToggle.checked = Boolean(state.ignoreDataMjxAttributes);
  }
  if (diffChannelSelect.value !== state.diff.channelId) {
    diffChannelSelect.value = state.diff.channelId;
  }
  if (diffViewSelect.value !== state.diff.viewMode) {
    diffViewSelect.value = state.diff.viewMode;
  }
  if (latexSetupInput.value !== state.latexSetup) {
    latexSetupInput.value = state.latexSetup;
  }
  if (latexInput.value !== state.latexInput) {
    latexInput.value = state.latexInput;
  }
  if (latexTargetSelect.value !== (state.latexTarget || 'A')) {
    latexTargetSelect.value = state.latexTarget || 'A';
  }
  if (nimasTargetSelect.value !== (state.nimas?.target || 'A')) {
    nimasTargetSelect.value = state.nimas?.target || 'A';
  }
  if (epubTargetSelect.value !== (state.epub?.target || 'A')) {
    epubTargetSelect.value = state.epub?.target || 'A';
  }
}

function setPersistenceStatus(message, state = 'idle') {
  const node = document.querySelector('#persistence-status');
  if (!node) {
    return;
  }
  node.textContent = message;
  node.className = `persistence-status status-${state}`;
}

function setLatexStatus(message, state = 'idle') {
  const node = document.querySelector('#latex-status');
  if (!node) {
    return;
  }
  node.textContent = message;
  node.className = `latex-status status-${state}`;
}

function renderLatexPreview(mathml) {
  const node = document.querySelector('#latex-last-mathml');
  if (!node) {
    return;
  }
  node.textContent = mathml || '';
}

function setNimasStatus(message, state = 'idle') {
  const node = document.querySelector('#nimas-status');
  if (!node) {
    return;
  }
  node.textContent = message;
  node.className = `small-note status-${state}`;
}

function renderNimasPanel(state) {
  const select = document.querySelector('#nimas-instance-select');
  const meta = document.querySelector('#nimas-instance-meta');
  const preview = document.querySelector('#nimas-image-preview');
  const instances = state.nimas?.instances || [];
  setNimasStatus(state.nimas?.status || 'No NIMAS source loaded yet.', state.nimas?.statusLevel || 'idle');

  const currentValue = select.value;
  select.innerHTML = '';
  for (const instance of instances) {
    const option = document.createElement('option');
    option.value = String(instance.index);
    option.textContent = `${instance.id}${instance.alttext ? ` - ${truncate(instance.alttext, 56)}` : ''}`;
    select.append(option);
  }

  const selectedIndex = state.nimas?.selectedIndex ?? -1;
  if (instances.length === 0) {
    meta.textContent = 'No MathML instances loaded.';
    preview.classList.add('hidden');
    preview.removeAttribute('src');
    return;
  }

  const selected = instances.find((entry) => entry.index === selectedIndex) || instances[0];
  if (currentValue !== String(selected.index)) {
    select.value = String(selected.index);
  }
  const altText = selected.alttext ? ` alttext: ${selected.alttext}` : '';
  const altImg = selected.altimg ? ` altimg: ${selected.altimg}` : '';
  meta.textContent = `Selected ${selected.id}.${altImg}${altText}`;

  if (selected.imageUrl) {
    preview.src = selected.imageUrl;
    preview.alt = selected.alttext || `Image for ${selected.id}`;
    preview.title = 'Click to open full-size image';
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
    preview.removeAttribute('src');
    preview.removeAttribute('title');
  }
}

function setEpubStatus(message, state = 'idle') {
  const node = document.querySelector('#epub-status');
  if (!node) {
    return;
  }
  node.textContent = message;
  node.className = `small-note status-${state}`;
}

function renderEpubPanel(state) {
  const select = document.querySelector('#epub-instance-select');
  const meta = document.querySelector('#epub-instance-meta');
  const preview = document.querySelector('#epub-image-preview');
  const instances = state.epub?.instances || [];
  setEpubStatus(state.epub?.status || 'No EPUB source loaded yet.', state.epub?.statusLevel || 'idle');

  const currentValue = select.value;
  select.innerHTML = '';
  for (const instance of instances) {
    const option = document.createElement('option');
    option.value = String(instance.index);
    option.textContent = `${instance.id}${instance.sourcePath ? ` [${truncate(instance.sourcePath, 42)}]` : ''}`;
    select.append(option);
  }

  const selectedIndex = state.epub?.selectedIndex ?? -1;
  if (instances.length === 0) {
    meta.textContent = 'No MathML instances loaded.';
    preview.classList.add('hidden');
    preview.removeAttribute('src');
    preview.removeAttribute('title');
    return;
  }

  const selected = instances.find((entry) => entry.index === selectedIndex) || instances[0];
  if (currentValue !== String(selected.index)) {
    select.value = String(selected.index);
  }

  const sourceText = selected.sourcePath ? ` source: ${selected.sourcePath}` : '';
  const altText = selected.alttext ? ` alttext: ${selected.alttext}` : '';
  const altImg = selected.altimg ? ` altimg: ${selected.altimg}` : '';
  meta.textContent = `Selected ${selected.id}.${sourceText}${altImg}${altText}`;

  if (selected.imageUrl) {
    preview.src = selected.imageUrl;
    preview.alt = selected.alttext || `Image for ${selected.id}`;
    preview.title = 'Click to open full-size image';
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
    preview.removeAttribute('src');
    preview.removeAttribute('title');
  }
}

function openNimasImageModal(backdrop, titleNode, imageNode, zoomRange, zoomValue, src, alt, title) {
  zoomRange.value = '100';
  zoomValue.textContent = '100%';
  titleNode.textContent = title || 'Linked Image';
  imageNode.dataset.naturalWidth = '';
  imageNode.style.width = '';
  imageNode.src = src;
  imageNode.alt = alt || 'NIMAS image full size preview';
  backdrop.classList.remove('hidden');
  backdrop.setAttribute('aria-hidden', 'false');
}

function closeNimasImageModal(backdrop, imageNode, zoomRange, zoomValue) {
  backdrop.classList.add('hidden');
  backdrop.setAttribute('aria-hidden', 'true');
  zoomRange.value = '100';
  zoomValue.textContent = '100%';
  imageNode.style.width = '';
  imageNode.dataset.naturalWidth = '';
  imageNode.removeAttribute('src');
}

function applyNimasImageZoom(imageNode, zoomRange, zoomValue) {
  const zoom = clampZoom(Number(zoomRange.value) || 100);
  zoomRange.value = String(zoom);
  zoomValue.textContent = `${zoom}%`;

  const naturalWidth = Number(imageNode.dataset.naturalWidth || 0);
  if (!naturalWidth) {
    return;
  }

  const scaledWidth = Math.max(1, Math.round((naturalWidth * zoom) / 100));
  imageNode.style.width = `${scaledWidth}px`;
}

function clampZoom(value) {
  return Math.min(400, Math.max(100, value));
}

function truncate(value, max) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function renderStatus(state) {
  const status = document.querySelector('#status-json');
  const summary = {
    schemaVersion: state.schemaVersion,
    mathjax: state.mathjax,
    lintProfile: state.lintProfile,
    ignoreDataMjxAttributes: Boolean(state.ignoreDataMjxAttributes),
    nimas: {
      sourceLabel: state.nimas?.sourceLabel || '',
      status: state.nimas?.status || '',
      instances: state.nimas?.instances?.length || 0,
      selectedIndex: state.nimas?.selectedIndex ?? -1
    },
    epub: {
      sourceLabel: state.epub?.sourceLabel || '',
      status: state.epub?.status || '',
      instances: state.epub?.instances?.length || 0,
      selectedIndex: state.epub?.selectedIndex ?? -1
    },
    lengths: {
      mathmlA: state.mathmlA.length,
      mathmlB: state.mathmlB.length,
      latexSetup: state.latexSetup.length,
      latexInput: state.latexInput.length
    },
    meta: state.meta,
    sharePreview: serializeShareState(state),
    shareUrl: toShareUrl(state)
  };
  status.textContent = JSON.stringify(summary, null, 2);
}

function populateDiffChannels(selectEl) {
  const channels = getAccessibilityChannels();
  selectEl.innerHTML = '';

  for (const channel of channels) {
    const option = document.createElement('option');
    option.value = channel.id;
    option.textContent = channel.label;
    selectEl.append(option);
  }
}

function renderMathJaxLoadStatus(state) {
  const el = document.querySelector('#mathjax-load-status');
  const { loadState, loadMessage } = state.mathjax;
  el.textContent = `MathJax: ${loadState} - ${loadMessage}`;
  el.className = `mathjax-status status-${loadState}`;
}

function renderAnalysisPanels(state) {
  renderAnalysisList('#lint-findings-a', state.lintFindings.A || []);
  renderAnalysisList('#lint-findings-b', state.lintFindings.B || []);
  renderAnalysisList('#intent-suggestions-a', state.intentSuggestions.A || [], true);
  renderAnalysisList('#intent-suggestions-b', state.intentSuggestions.B || [], true);
}

function renderAnalysisList(selector, items, includeLinks = false) {
  const list = document.querySelector(selector);
  if (!list) {
    return;
  }

  list.innerHTML = '';

  for (const item of items) {
    const li = document.createElement('li');
    li.className = `analysis-item severity-${item.severity || 'info'}`;

    const title = document.createElement('strong');
    title.textContent = `${String(item.severity || 'info').toUpperCase()}: ${item.title || 'Note'}`;
    li.append(title);

    const text = document.createElement('p');
    text.textContent = item.message || '';
    li.append(text);

    if (includeLinks && item.link) {
      const link = document.createElement('a');
      link.href = item.link;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      link.textContent = 'W3C reference';
      li.append(link);
    }

    list.append(li);
  }
}

function renderOutputDiff(state) {
  const channel = state.diff.channelId;
  const channelState = state.outputs.channels[channel];
  const summary = document.querySelector('#diff-summary');
  const unifiedPane = document.querySelector('#diff-unified');
  const sidePane = document.querySelector('#diff-side-by-side');
  const sideA = document.querySelector('#diff-side-a');
  const sideB = document.querySelector('#diff-side-b');

  if (!channelState) {
    summary.textContent = 'Select a valid channel.';
    unifiedPane.textContent = '';
    sideA.textContent = '';
    sideB.textContent = '';
    return;
  }

  const result = diffOutputs(channelState.A, channelState.B, {
    granularity: channel === 'mathcatBraille' ? 'char' : 'word'
  });
  summary.textContent = result.equal
    ? 'No A/B differences for selected channel.'
    : `A/B differences detected for channel ${channel}.`;

  unifiedPane.textContent = result.unifiedLines.join('\n');

  sideA.innerHTML = '';
  sideB.innerHTML = '';
  for (const row of result.sideBySide.left) {
    sideA.append(buildDiffSpan(row.type, row.value));
  }
  for (const row of result.sideBySide.right) {
    sideB.append(buildDiffSpan(row.type, row.value));
  }

  if (state.diff.viewMode === 'side-by-side') {
    unifiedPane.classList.add('hidden');
    sidePane.classList.remove('hidden');
  } else {
    sidePane.classList.add('hidden');
    unifiedPane.classList.remove('hidden');
  }
}

function buildDiffSpan(type, value) {
  const span = document.createElement('span');
  span.className = `diff-${type}`;
  span.textContent = value;
  return span;
}

function createRenderScheduler(store) {
  let timerId = 0;
  let renderToken = 0;

  return {
    schedule() {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(async () => {
        renderToken += 1;
        const token = renderToken;
        await renderAll(store, token, () => renderToken);
      }, 150);
    }
  };
}

async function renderAll(store, token, getLatestToken) {
  const state = store.getState();
  renderNativeMathML(state);

  const loaded = await ensureMathJaxLoaded(store, state.mathjax.versionId, state.mathjax.outputMode);
  if (!loaded || token !== getLatestToken()) {
    return;
  }

  await renderMathJaxMathML(state);
  await ensureAccessibilityEngines(store);
  await generateAccessibilityOutputs(store);
}

function renderNativeMathML(state) {
  renderNativeExpression(state.mathmlA, '#native-render-a');
  renderNativeExpression(state.mathmlB, '#native-render-b');
}

function renderNativeExpression(source, selector) {
  const host = document.querySelector(selector);
  host.innerHTML = '';

  if (!source.trim()) {
    host.append(buildInfoNode('Expression is empty.'));
    return;
  }

  const parsed = parseMathML(source);
  if (parsed.error) {
    host.append(buildErrorNode(parsed.error));
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'render-surface';
  wrapper.append(parsed.node);
  host.append(wrapper);
}

async function renderMathJaxMathML(state) {
  const wrappers = [
    mountMathJaxExpression(state.mathmlA, '#mathjax-render-a'),
    mountMathJaxExpression(state.mathmlB, '#mathjax-render-b')
  ].filter(Boolean);

  if (!window.MathJax || wrappers.length === 0) {
    return;
  }

  try {
    if (window.MathJax.Hub?.Queue) {
      const queueItems = wrappers.map((wrapper) => ['Typeset', window.MathJax.Hub, wrapper]);
      await new Promise((resolve) => {
        window.MathJax.Hub.Queue(...queueItems, resolve);
      });
      return;
    }

    if (window.MathJax.typesetClear) {
      window.MathJax.typesetClear(wrappers);
    }

    if (window.MathJax.typesetPromise) {
      await window.MathJax.typesetPromise(wrappers);
    }
  } catch (error) {
    for (const wrapper of wrappers) {
      wrapper.parentElement?.append(buildErrorNode(`MathJax typeset error: ${error.message}`));
    }
  }
}

function mountMathJaxExpression(source, selector) {
  const host = document.querySelector(selector);
  host.innerHTML = '';

  if (!source.trim()) {
    host.append(buildInfoNode('Expression is empty.'));
    return null;
  }

  const parsed = parseMathML(source);
  if (parsed.error) {
    host.append(buildErrorNode(parsed.error));
    return null;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'render-surface';
  wrapper.append(parsed.node);
  host.append(wrapper);

  if (!window.MathJax) {
    host.append(buildErrorNode('MathJax runtime unavailable.'));
    return null;
  }

  return wrapper;
}

async function ensureMathJaxLoaded(store, versionId, outputMode) {
  const version = MATHJAX_VERSIONS.find((entry) => entry.id === versionId);
  if (!version) {
    setMathJaxLoadStatus(store, 'error', `Unknown MathJax version: ${versionId}`);
    return false;
  }

  const cdnUrl = version.cdnByMode[outputMode] || version.cdnByMode.chtml;
  const requestKey = `${versionId}:${outputMode}:${cdnUrl}`;

  if (mathJaxRuntime.loadedKey === requestKey && window.MathJax) {
    setMathJaxLoadStatus(store, 'ready', `${version.label} (${outputMode.toUpperCase()})`);
    return true;
  }

  mathJaxRuntime.loadId += 1;
  const currentLoadId = mathJaxRuntime.loadId;

  setMathJaxLoadStatus(store, 'loading', `Loading ${version.label} (${outputMode.toUpperCase()})...`);

  cleanupMathJaxRuntime();
  configureMathJaxGlobal(version.major);

  try {
    await loadScript(cdnUrl, MATHJAX_SCRIPT_ID);

    if (currentLoadId !== mathJaxRuntime.loadId) {
      return false;
    }

    if (window.MathJax?.startup?.promise) {
      await window.MathJax.startup.promise;
    }

    mathJaxRuntime.loadedKey = requestKey;
    setMathJaxLoadStatus(store, 'ready', `${version.label} (${outputMode.toUpperCase()})`);
    return true;
  } catch (error) {
    mathJaxRuntime.loadedKey = '';
    setMathJaxLoadStatus(store, 'error', `Failed to load MathJax: ${error.message}`);
    return false;
  }
}

function setMathJaxLoadStatus(store, loadState, loadMessage) {
  const current = store.getState().mathjax;
  if (current.loadState === loadState && current.loadMessage === loadMessage) {
    return;
  }

  store.setState((draft) => {
    draft.mathjax.loadState = loadState;
    draft.mathjax.loadMessage = loadMessage;
  });
}

function cleanupMathJaxRuntime() {
  const previous = document.querySelector(`#${MATHJAX_SCRIPT_ID}`);
  if (previous) {
    previous.remove();
  }

  if (window.MathJax?.typesetClear) {
    try {
      window.MathJax.typesetClear();
    } catch {
      // ignore cleanup failures from prior runtime.
    }
  }

  delete window.MathJax;
}

function configureMathJaxGlobal(majorVersion) {
  if (majorVersion <= 2) {
    window.MathJax = {
      showMathMenu: true,
      messageStyle: 'none',
      menuSettings: {
        context: 'MathJax'
      },
      extensions: ['MathMenu.js', 'MathZoom.js']
    };
    return;
  }

  window.MathJax = {
    loader: {
      load: ['ui/menu', 'a11y/explorer']
    },
    options: {
      enableMenu: true,
      menuOptions: {
        settings: {
          explorer: true,
          assistiveMml: true
        }
      }
    },
    startup: {
      typeset: false
    }
  };
}

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load script: ${src}`));
    document.head.append(script);
  });
}

function parseMathML(source) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'application/xml');
  const parseError = doc.querySelector('parsererror');

  if (parseError) {
    return { error: parseError.textContent || 'Invalid MathML/XML.' };
  }

  return { node: document.importNode(doc.documentElement, true) };
}

function buildInfoNode(message) {
  const node = document.createElement('p');
  node.className = 'output-info';
  node.textContent = message;
  return node;
}

function buildErrorNode(message) {
  const node = document.createElement('p');
  node.className = 'output-error';
  node.textContent = message;
  return node;
}

function wireStateSideEffects(store, bus) {
  const renderScheduler = createRenderScheduler(store);
  let lastAnalysisSignature = '';

  bus.on('state:changed', (state) => {
    const signature = `${state.lintProfile}\u0000${state.ignoreDataMjxAttributes ? '1' : '0'}\u0000${state.mathmlA}\u0000${state.mathmlB}`;
    if (signature !== lastAnalysisSignature) {
      const lintOptions = {
        profile: state.lintProfile,
        ignoreDataMjxAttributes: Boolean(state.ignoreDataMjxAttributes)
      };
      const lintA = runLint(state.mathmlA, lintOptions).findings;
      const lintB = runLint(state.mathmlB, lintOptions).findings;
      const intentA = getIntentSuggestions(state.mathmlA).suggestions;
      const intentB = getIntentSuggestions(state.mathmlB).suggestions;
      lastAnalysisSignature = signature;

      if (JSON.stringify(state.lintFindings.A) !== JSON.stringify(lintA) ||
          JSON.stringify(state.lintFindings.B) !== JSON.stringify(lintB) ||
          JSON.stringify(state.intentSuggestions.A) !== JSON.stringify(intentA) ||
          JSON.stringify(state.intentSuggestions.B) !== JSON.stringify(intentB)) {
        store.setState((draft) => {
          draft.lintFindings.A = lintA;
          draft.lintFindings.B = lintB;
          draft.intentSuggestions.A = intentA;
          draft.intentSuggestions.B = intentB;
        });
        return;
      }
    }

    persistState(STORAGE_KEY, state);
    syncControlValues(state);
    renderStatus(state);
    renderMathJaxLoadStatus(state);
    renderAccessibilityPanels(state);
    renderAnalysisPanels(state);
    renderOutputDiff(state);
    renderNimasPanel(state);
    renderEpubPanel(state);
    renderScheduler.schedule();
  });
}

function bootstrap() {
  const bus = createEventBus();
  const localHydrated = hydrateState(STORAGE_KEY, createInitialState());
  const queryHydrated = hydrateStateFromQuery(window.location.search, localHydrated);
  const loaded = queryHydrated.state;
  const store = createStore(loaded, bus);

  createEditorController(store, bus);
  wireControls(store);
  wireStateSideEffects(store, bus);

  runLint(store.getState().mathmlA, {
    profile: store.getState().lintProfile,
    ignoreDataMjxAttributes: Boolean(store.getState().ignoreDataMjxAttributes)
  });
  getIntentSuggestions(store.getState().mathmlA);
  diffOutputs('', '');

  renderStatus(store.getState());
  renderMathJaxLoadStatus(store.getState());
  renderAccessibilityPanels(store.getState());
  renderAnalysisPanels(store.getState());
  renderOutputDiff(store.getState());
  renderNimasPanel(store.getState());
  renderEpubPanel(store.getState());
  renderLatexPreview('');
  setPersistenceStatus(queryHydrated.message || 'Ready.', queryHydrated.level || 'idle');
  setLatexStatus('LaTeX conversion idle.', 'idle');
  bus.emit('state:changed', store.getState());
}

bootstrap();

export { MATHJAX_VERSIONS, createInitialState };

const CHANNELS = [
  { id: 'mathcatClearspeak', label: 'MathCAT ClearSpeak', engine: 'mathcat', mode: 'speech', style: 'ClearSpeak' },
  { id: 'mathcatSimplespeak', label: 'MathCAT SimpleSpeak', engine: 'mathcat', mode: 'speech', style: 'SimpleSpeak' },
  { id: 'mathcatBraille', label: 'MathCAT Braille', engine: 'mathcat', mode: 'braille', style: 'UEB' },
  { id: 'sreClearspeak', label: 'SRE ClearSpeak', engine: 'sre', mode: 'speech', style: 'ClearSpeak' },
  { id: 'sreMathspeak', label: 'SRE MathSpeak', engine: 'sre', mode: 'speech', style: 'MathSpeak' }
];

const DEFAULT_MATHCAT_TAG = '0.7.6-beta.1-web.1';
const DEFAULT_MATHCAT_PKG_BASE = `https://cdn.jsdelivr.net/gh/brichwin/MathCATForWeb@${DEFAULT_MATHCAT_TAG}/pkg/`;

const DEFAULT_CONFIG = {
  mathcatTag: DEFAULT_MATHCAT_TAG,
  mathcatPkgBase: DEFAULT_MATHCAT_PKG_BASE,
  mathcatJsUrl: `${DEFAULT_MATHCAT_PKG_BASE}mathcat_web.js`,
  mathcatWasmUrl: `${DEFAULT_MATHCAT_PKG_BASE}mathcat_web_bg.wasm`,
  sreScriptUrl: 'https://cdn.jsdelivr.net/npm/speech-rule-engine@4.0.7/lib/sre.js'
};

const runtime = {
  config: {
    ...DEFAULT_CONFIG,
    ...(window.MLW_CONFIG || {})
  },
  scriptLoads: new Map(),
  mathcat: {
    promise: null,
    api: null
  },
  engines: {
    mathcat: { state: 'idle', message: 'MathCAT not initialized.' },
    sre: { state: 'idle', message: 'SRE not initialized.' }
  },
  sreReady: false
};

function createDefaultOutputsState() {
  const channels = {};
  for (const channel of CHANNELS) {
    channels[channel.id] = {
      A: '',
      B: '',
      state: 'idle',
      message: 'Waiting for engine initialization.'
    };
  }

  return {
    engines: {
      mathcat: { state: 'idle', message: 'MathCAT not initialized.' },
      sre: { state: 'idle', message: 'SRE not initialized.' }
    },
    channels
  };
}

function getAccessibilityChannels() {
  return CHANNELS;
}

async function ensureAccessibilityEngines(store) {
  await Promise.all([ensureMathcatEngine(store), ensureSreEngine(store)]);
}

async function generateAccessibilityOutputs(store) {
  const state = store.getState();
  const nextOutputs = structuredClone(state.outputs);

  for (const channel of CHANNELS) {
    const resultA = await generateForChannel(channel, state.mathmlA);
    const resultB = await generateForChannel(channel, state.mathmlB);

    nextOutputs.channels[channel.id].A = resultA.value;
    nextOutputs.channels[channel.id].B = resultB.value;
    nextOutputs.channels[channel.id].state = resultA.state === 'error' || resultB.state === 'error' ? 'error' : 'ready';
    nextOutputs.channels[channel.id].message = resultA.state === 'error' ? resultA.message : resultB.message;

    if (resultA.state === 'empty' && resultB.state === 'empty') {
      nextOutputs.channels[channel.id].state = 'idle';
      nextOutputs.channels[channel.id].message = 'Expressions are empty.';
    }

    if (resultA.state === 'unavailable' || resultB.state === 'unavailable') {
      nextOutputs.channels[channel.id].state = 'unavailable';
      nextOutputs.channels[channel.id].message = resultA.state === 'unavailable' ? resultA.message : resultB.message;
    }
  }

  syncEngineState(nextOutputs);

  if (JSON.stringify(nextOutputs) !== JSON.stringify(state.outputs)) {
    store.setState((draft) => {
      draft.outputs = nextOutputs;
    });
  }
}

function renderAccessibilityPanels(state) {
  renderEngineStatus(state.outputs.engines.mathcat, '#mathcat-engine-status', 'MathCAT');
  renderEngineStatus(state.outputs.engines.sre, '#sre-engine-status', 'SRE');

  for (const channel of CHANNELS) {
    const channelState = state.outputs.channels[channel.id];
    const statusEl = document.querySelector(`#output-status-${channel.id}`);
    const aEl = document.querySelector(`#output-${channel.id}-a`);
    const bEl = document.querySelector(`#output-${channel.id}-b`);

    if (!statusEl || !aEl || !bEl) {
      continue;
    }

    statusEl.textContent = `${channelState.state}: ${channelState.message}`;
    statusEl.className = `channel-status status-${channelState.state}`;
    aEl.textContent = channelState.A;
    bEl.textContent = channelState.B;
  }
}

async function ensureMathcatEngine(store) {
  if (runtime.mathcat.api) {
    setEngine('mathcat', 'ready', `MathCAT runtime loaded (${runtime.config.mathcatTag}).`);
    syncEngineStateToStore(store);
    return;
  }

  if (runtime.engines.mathcat.state === 'loading' || runtime.engines.mathcat.state === 'unavailable') {
    return;
  }

  setEngine('mathcat', 'loading', `Loading MathCAT (${runtime.config.mathcatTag})...`);
  syncEngineStateToStore(store);

  try {
    const api = await ensureMathCATModule();
    runtime.mathcat.api = api;
    setEngine('mathcat', 'ready', `MathCAT runtime loaded (${runtime.config.mathcatTag}).`);
  } catch (error) {
    setEngine('mathcat', 'unavailable', `MathCAT unavailable: ${error.message}`);
  }

  syncEngineStateToStore(store);
}

async function ensureMathCATModule() {
  if (runtime.mathcat.api) {
    return runtime.mathcat.api;
  }

  if (runtime.mathcat.promise) {
    return runtime.mathcat.promise;
  }

  runtime.mathcat.promise = (async () => {
    let mod = null;
    let init = null;
    let mathCAT = null;
    let lastError = null;

    for (const candidate of getMathcatModuleCandidates(runtime.config.mathcatJsUrl)) {
      try {
        mod = await import(candidate);
        init = mod.default;
        mathCAT = mod.MathCAT;
        if (!init || !mathCAT) {
          throw new Error(`MathCAT module at ${candidate} did not expose default init + MathCAT.`);
        }
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!init || !mathCAT) {
      throw new Error(`MathCAT module load failed: ${lastError?.message || 'unknown error'}`);
    }

    try {
      await init({ module_or_path: runtime.config.mathcatWasmUrl });
    } catch {
      try {
        await init(runtime.config.mathcatWasmUrl);
      } catch {
        await init();
      }
    }

    try {
      mathCAT.setRulesDir('Rules');
    } catch {
      // optional in some builds
    }

    applyMathcatPrefs(mathCAT);
    runtime.mathcat.api = mathCAT;
    return mathCAT;
  })();

  return runtime.mathcat.promise;
}

function getMathcatModuleCandidates(primaryUrl) {
  const urls = [primaryUrl];
  if (primaryUrl.includes('mathcat_web.js')) {
    urls.push(primaryUrl.replace('mathcat_web.js', 'mathcat_for_web.js'));
  } else if (primaryUrl.includes('mathcat_for_web.js')) {
    urls.push(primaryUrl.replace('mathcat_for_web.js', 'mathcat_web.js'));
  }

  return [...new Set(urls)];
}

function applyMathcatPrefs(mathCAT) {
  try {
    mathCAT.setPreference('Language', 'en');
    mathCAT.setPreference('Verbosity', 'Verbose');
    mathCAT.setPreference('SpeechStyle', 'ClearSpeak');
    mathCAT.setPreference('BrailleCode', 'UEB');
  } catch {
    // preference application is best-effort.
  }
}

async function ensureSreEngine(store) {
  if (window.SRE || window.sre) {
    setEngine('sre', 'ready', 'SRE runtime detected.');
    syncEngineStateToStore(store);
    return;
  }

  if (runtime.engines.sre.state === 'loading' || runtime.engines.sre.state === 'unavailable') {
    return;
  }

  setEngine('sre', 'loading', `Loading SRE runtime (${runtime.config.sreScriptUrl})...`);
  syncEngineStateToStore(store);

  try {
    await loadRuntimeScript(runtime.config.sreScriptUrl, 'sre-runtime-script');
    if (window.SRE || window.sre) {
      setEngine('sre', 'ready', 'SRE runtime loaded.');
    } else {
      setEngine('sre', 'unavailable', 'SRE script loaded but no global API was found.');
    }
  } catch (error) {
    setEngine('sre', 'unavailable', `SRE unavailable: ${error.message}`);
  }

  syncEngineStateToStore(store);
}

async function generateForChannel(channel, mathml) {
  if (!mathml.trim()) {
    return { state: 'empty', value: '', message: 'Expression is empty.' };
  }

  if (channel.engine === 'mathcat') {
    if (runtime.engines.mathcat.state !== 'ready' || !runtime.mathcat.api) {
      return { state: 'unavailable', value: '', message: runtime.engines.mathcat.message };
    }

    try {
      const value = channel.mode === 'braille'
        ? generateMathcatBraille(runtime.mathcat.api, mathml, channel.style)
        : generateMathcatSpeech(runtime.mathcat.api, mathml, channel.style);

      return { state: 'ready', value: value || '', message: 'Generated successfully.' };
    } catch (error) {
      return { state: 'error', value: '', message: `MathCAT generation failed: ${error.message}` };
    }
  }

  if (channel.engine === 'sre') {
    if (runtime.engines.sre.state !== 'ready') {
      return { state: 'unavailable', value: '', message: runtime.engines.sre.message };
    }

    try {
      const value = await generateSreSpeech(mathml, channel.style);
      return { state: 'ready', value: value || '', message: 'Generated successfully.' };
    } catch (error) {
      return { state: 'error', value: '', message: `SRE generation failed: ${error.message}` };
    }
  }

  return { state: 'error', value: '', message: `Unknown engine: ${channel.engine}` };
}

function generateMathcatSpeech(mathCAT, mathml, style) {
  mathCAT.setMathML(mathml);
  mathCAT.setPreference('Language', 'en');
  mathCAT.setPreference('SpeechStyle', style);
  mathCAT.setPreference('Verbosity', 'Verbose');
  return mathCAT.getSpokenText();
}

function generateMathcatBraille(mathCAT, mathml, brailleCode) {
  mathCAT.setMathML(mathml);
  mathCAT.setPreference('Language', 'en');
  mathCAT.setPreference('BrailleCode', brailleCode || 'UEB');
  return mathCAT.getBraille('');
}

async function generateSreSpeech(mathml, style) {
  const sre = window.SRE || window.sre;

  if (!runtime.sreReady && typeof sre?.setupEngine === 'function') {
    await sre.setupEngine({
      locale: 'en',
      modality: 'speech',
      domain: style === 'MathSpeak' ? 'mathspeak' : 'clearspeak',
      style: 'default'
    });
    runtime.sreReady = true;
  }

  if (typeof sre?.toSpeech === 'function') {
    const domain = style === 'MathSpeak' ? 'mathspeak' : 'clearspeak';
    if (typeof sre?.setupEngine === 'function') {
      await sre.setupEngine({ locale: 'en', modality: 'speech', domain, style: 'default' });
    }
    return sre.toSpeech(mathml);
  }

  if (typeof sre?.engineSetup === 'function' && typeof sre?.toSpeech === 'function') {
    sre.engineSetup({ locale: 'en', domain: style === 'MathSpeak' ? 'mathspeak' : 'clearspeak' });
    return sre.toSpeech(mathml);
  }

  throw new Error('No supported SRE speech API found.');
}

function loadRuntimeScript(src, id) {
  const existing = runtime.scriptLoads.get(id);
  if (existing) {
    return existing;
  }

  const promise = new Promise((resolve, reject) => {
    const current = document.querySelector(`#${id}`);
    if (current) {
      current.remove();
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load script: ${src}`));
    document.head.append(script);
  });

  runtime.scriptLoads.set(id, promise);
  return promise;
}

function setEngine(engineName, state, message) {
  runtime.engines[engineName] = { state, message };
}

function syncEngineState(outputState) {
  outputState.engines.mathcat = { ...runtime.engines.mathcat };
  outputState.engines.sre = { ...runtime.engines.sre };
}

function syncEngineStateToStore(store) {
  const current = store.getState();
  const next = structuredClone(current.outputs);
  syncEngineState(next);
  if (JSON.stringify(next.engines) !== JSON.stringify(current.outputs.engines)) {
    store.setState((draft) => {
      draft.outputs.engines = next.engines;
    });
  }
}

function renderEngineStatus(engineState, selector, label) {
  const el = document.querySelector(selector);
  if (!el) {
    return;
  }

  el.textContent = `${label}: ${engineState.state} - ${engineState.message}`;
  el.className = `engine-status status-${engineState.state}`;
}

export {
  createDefaultOutputsState,
  ensureAccessibilityEngines,
  generateAccessibilityOutputs,
  getAccessibilityChannels,
  renderAccessibilityPanels
};

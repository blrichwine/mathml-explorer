function persistState(storageKey, state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function hydrateState(storageKey, fallbackState) {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return fallbackState;
  }

  try {
    const parsed = JSON.parse(raw);
    return mergeWithFallback(fallbackState, parsed);
  } catch {
    return fallbackState;
  }
}

function hydrateStateFromQuery(search, fallbackState) {
  const params = new URLSearchParams(search || '');
  if (!params.has('v')) {
    return { state: fallbackState, message: '', level: 'idle' };
  }

  try {
    const parsed = {
      schemaVersion: parseInt(params.get('v') || '1', 10) || 1,
      mathmlA: decodeQueryValue(params.get('a')),
      mathmlB: decodeQueryValue(params.get('b')),
      latexSetup: decodeQueryValue(params.get('ls')),
      latexInput: decodeQueryValue(params.get('lx')),
      mathjax: {
        versionId: params.get('mjv') || fallbackState.mathjax.versionId,
        outputMode: params.get('mjo') || fallbackState.mathjax.outputMode
      }
    };

    return {
      state: mergeWithFallback(fallbackState, parsed),
      message: 'State hydrated from share URL.',
      level: 'ready'
    };
  } catch {
    return {
      state: fallbackState,
      message: 'Share URL is invalid and was ignored.',
      level: 'warn'
    };
  }
}

function serializeShareState(state) {
  const payload = new URLSearchParams();
  payload.set('v', String(state.schemaVersion || 1));
  payload.set('a', encodeQueryValue(state.mathmlA || ''));
  payload.set('b', encodeQueryValue(state.mathmlB || ''));
  payload.set('mjv', state.mathjax?.versionId || '');
  payload.set('mjo', state.mathjax?.outputMode || '');
  payload.set('ls', encodeQueryValue(state.latexSetup || ''));
  payload.set('lx', encodeQueryValue(state.latexInput || ''));
  return payload.toString();
}

function toShareUrl(state, locationLike = window.location) {
  const query = serializeShareState(state);
  return `${locationLike.origin}${locationLike.pathname}?${query}`;
}

function exportStateToJson(state) {
  return JSON.stringify(state, null, 2);
}

function importStateFromJson(jsonText, fallbackState) {
  const parsed = JSON.parse(jsonText);
  return mergeWithFallback(fallbackState, parsed);
}

function mergeWithFallback(fallbackState, parsed) {
  return {
    ...fallbackState,
    ...parsed,
    mathjax: {
      ...fallbackState.mathjax,
      ...(parsed.mathjax || {})
    },
    outputs: {
      ...fallbackState.outputs,
      ...(parsed.outputs || {}),
      engines: {
        ...fallbackState.outputs.engines,
        ...((parsed.outputs && parsed.outputs.engines) || {})
      },
      channels: {
        ...fallbackState.outputs.channels,
        ...((parsed.outputs && parsed.outputs.channels) || {})
      }
    },
    lintFindings: {
      ...fallbackState.lintFindings,
      ...(parsed.lintFindings || {})
    },
    intentSuggestions: {
      ...fallbackState.intentSuggestions,
      ...(parsed.intentSuggestions || {})
    },
    diff: {
      ...fallbackState.diff,
      ...(parsed.diff || {})
    },
    nimas: {
      ...fallbackState.nimas,
      ...(parsed.nimas || {}),
      instances: Array.isArray(parsed?.nimas?.instances) ? parsed.nimas.instances : fallbackState.nimas.instances
    },
    meta: {
      ...fallbackState.meta,
      ...(parsed.meta || {})
    }
  };
}

function encodeQueryValue(raw) {
  const bytes = new TextEncoder().encode(String(raw || ''));
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeQueryValue(encoded) {
  if (!encoded) {
    return '';
  }

  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export {
  exportStateToJson,
  hydrateState,
  hydrateStateFromQuery,
  importStateFromJson,
  persistState,
  serializeShareState,
  toShareUrl
};

let unicodeNameMap = null;
let unicodeLoadPromise = null;

function getUnicodeDataUrl() {
  return new URL('./UnicodeData.txt', import.meta.url).toString();
}

async function loadUnicodeNameMap() {
  if (unicodeNameMap) {
    return unicodeNameMap;
  }
  if (unicodeLoadPromise) {
    return unicodeLoadPromise;
  }

  unicodeLoadPromise = (async () => {
    const response = await fetch(getUnicodeDataUrl(), { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`UnicodeData load failed (${response.status}).`);
    }

    const text = await response.text();
    const map = new Map();
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (!line) {
        continue;
      }
      const firstSep = line.indexOf(';');
      if (firstSep <= 0) {
        continue;
      }
      const secondSep = line.indexOf(';', firstSep + 1);
      if (secondSep <= firstSep) {
        continue;
      }

      const hex = line.slice(0, firstSep);
      const name = line.slice(firstSep + 1, secondSep);
      const codePoint = Number.parseInt(hex, 16);
      if (!Number.isFinite(codePoint)) {
        continue;
      }
      map.set(codePoint, name);
    }

    unicodeNameMap = map;
    return map;
  })();

  return unicodeLoadPromise;
}

async function lookupUnicodeNameByCodePoint(codePoint) {
  if (!Number.isFinite(codePoint)) {
    return '';
  }
  try {
    const map = await loadUnicodeNameMap();
    return map.get(codePoint) || '';
  } catch {
    return '';
  }
}

export { loadUnicodeNameMap, lookupUnicodeNameByCodePoint };

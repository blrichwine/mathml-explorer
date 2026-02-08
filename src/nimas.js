const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

async function loadNimasFromDirectory() {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error('Directory picker is not supported in this browser. Use Load XML instead.');
  }

  const root = await window.showDirectoryPicker();
  const files = await collectFiles(root);

  const xmlEntry = files.find((entry) => entry.path.toLowerCase().endsWith('.xml'));
  if (!xmlEntry) {
    throw new Error('No XML file was found in the selected folder.');
  }

  const xmlText = await (await xmlEntry.handle.getFile()).text();
  const xmlDir = dirname(xmlEntry.path);

  const instances = parseNimasXml(xmlText, async (relativePath) => {
    const resolved = normalizePath(joinPath(xmlDir, relativePath));
    const fileEntry = files.find((entry) => normalizePath(entry.path) === resolved);
    if (!fileEntry) {
      return null;
    }

    const file = await fileEntry.handle.getFile();
    return {
      url: URL.createObjectURL(file),
      name: file.name
    };
  });

  return {
    instances: await resolveAllInstances(instances),
    sourceLabel: xmlEntry.path
  };
}

async function loadNimasFromFile(file) {
  const name = file?.name || '';
  if (!name.toLowerCase().endsWith('.xml')) {
    if (name.toLowerCase().endsWith('.zip')) {
      throw new Error('ZIP parsing is not enabled in-browser yet. Use Load Folder with the expanded NIMAS set.');
    }
    throw new Error('Please choose a NIMAS XML file.');
  }

  const xmlText = await file.text();
  const instances = parseNimasXml(xmlText, async () => null);

  return {
    instances: await resolveAllInstances(instances),
    sourceLabel: name
  };
}

function parseNimasXml(xmlText, resolveImage) {
  const doc = parseXmlForImport(xmlText);

  const mathNodes = [...doc.getElementsByTagNameNS(MATHML_NS, 'math')];
  const instances = [];

  for (let index = 0; index < mathNodes.length; index += 1) {
    const node = mathNodes[index];
    const id = node.getAttribute('id') || `math-${index + 1}`;
    const altimg = node.getAttribute('altimg') || '';
    const alttext = node.getAttribute('alttext') || '';

    instances.push({
      id,
      index,
      altimg,
      alttext,
      mathml: serializeNormalizedMath(node),
      imageResolver: resolveImage,
      imageUrl: '',
      imageName: ''
    });
  }

  return instances;
}

function parseXmlForImport(xmlText) {
  const first = parseXml(xmlText);
  if (!first.error) {
    return first.doc;
  }

  const stripped = stripDoctype(xmlText);
  if (stripped !== xmlText) {
    const second = parseXml(stripped);
    if (!second.error) {
      return second.doc;
    }

    // Last resort: keep unresolved named entities as literal text.
    const escaped = escapeUnknownEntities(stripped);
    const third = parseXml(escaped);
    if (!third.error) {
      return third.doc;
    }
  }

  throw new Error(first.error?.textContent || 'Invalid NIMAS XML.');
}

function parseXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const error = doc.querySelector('parsererror');
  return { doc, error };
}

function stripDoctype(xmlText) {
  if (!xmlText) {
    return xmlText;
  }

  let output = xmlText.replace(/<!DOCTYPE[\s\S]*?\]>/i, '');
  output = output.replace(/<!DOCTYPE[^>]*>/i, '');
  return output;
}

function escapeUnknownEntities(xmlText) {
  const BUILT_INS = new Set(['amp', 'lt', 'gt', 'apos', 'quot']);
  return String(xmlText || '').replace(/&([a-zA-Z_][\w.-]*);/g, (match, name) => {
    if (BUILT_INS.has(name)) {
      return match;
    }
    return `&amp;${name};`;
  });
}

async function resolveAllInstances(instances) {
  const resolved = [];

  for (const instance of instances) {
    let imageUrl = '';
    let imageName = '';

    if (instance.altimg) {
      try {
        const image = await instance.imageResolver(instance.altimg);
        if (image?.url) {
          imageUrl = image.url;
          imageName = image.name || instance.altimg;
        }
      } catch {
        // best effort
      }
    }

    resolved.push({
      id: instance.id,
      index: instance.index,
      altimg: instance.altimg,
      alttext: instance.alttext,
      mathml: instance.mathml,
      imageUrl,
      imageName
    });
  }

  return resolved;
}

function serializeNormalizedMath(node) {
  const doc = document.implementation.createDocument(MATHML_NS, 'math', null);
  const root = copyMathNode(node, doc);
  root.setAttribute('xmlns', MATHML_NS);
  return new XMLSerializer().serializeToString(root);
}

function copyMathNode(sourceNode, targetDoc) {
  if (sourceNode.nodeType === Node.TEXT_NODE) {
    return targetDoc.createTextNode(sourceNode.textContent || '');
  }

  if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
    return targetDoc.createTextNode('');
  }

  const local = sourceNode.localName || sourceNode.nodeName;
  const target = targetDoc.createElementNS(MATHML_NS, local);

  for (const attr of [...sourceNode.attributes]) {
    if (attr.name.startsWith('xmlns')) {
      continue;
    }

    target.setAttribute(attr.name, attr.value);
  }

  for (const child of [...sourceNode.childNodes]) {
    target.append(copyMathNode(child, targetDoc));
  }

  return target;
}

async function collectFiles(dirHandle, prefix = '') {
  const files = [];

  for await (const [name, handle] of dirHandle.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === 'file') {
      files.push({ path, handle });
    } else if (handle.kind === 'directory') {
      files.push(...(await collectFiles(handle, path)));
    }
  }

  return files;
}

function dirname(path) {
  const normalized = normalizePath(path);
  const idx = normalized.lastIndexOf('/');
  return idx < 0 ? '' : normalized.slice(0, idx);
}

function joinPath(base, relative) {
  if (!base) {
    return relative;
  }
  return `${base}/${relative}`;
}

function normalizePath(path) {
  const raw = String(path || '').replace(/\\/g, '/');
  const parts = raw.split('/');
  const normalized = [];

  for (const part of parts) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      normalized.pop();
      continue;
    }
    normalized.push(part);
  }

  return normalized.join('/');
}

export { loadNimasFromDirectory, loadNimasFromFile };

const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

async function loadEpubFromDirectory() {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error('Directory picker is not supported in this browser. Use Load File instead.');
  }

  const root = await window.showDirectoryPicker();
  const files = await collectFiles(root);
  const fileMap = new Map(files.map((entry) => [normalizePath(entry.path), entry]));

  const docPaths = await findContentDocPaths(files, fileMap);
  if (!docPaths.length) {
    throw new Error('No EPUB content documents (.xhtml/.html/.xml) were found in the selected folder.');
  }

  const instances = [];
  let runningIndex = 0;

  for (const docPath of docPaths) {
    const fileEntry = fileMap.get(normalizePath(docPath));
    if (!fileEntry) {
      continue;
    }

    const text = await (await fileEntry.handle.getFile()).text();
    const found = parseEpubContentDocument(text, docPath, async (relativePath) => {
      const resolved = normalizePath(joinPath(dirname(docPath), relativePath));
      const imageEntry = fileMap.get(resolved);
      if (!imageEntry) {
        return null;
      }

      const imageFile = await imageEntry.handle.getFile();
      return {
        url: URL.createObjectURL(imageFile),
        name: imageFile.name
      };
    });

    for (const entry of found) {
      instances.push({
        ...entry,
        index: runningIndex
      });
      runningIndex += 1;
    }
  }

  return {
    sourceLabel: root.name || 'EPUB folder',
    instances: await resolveAllInstances(instances)
  };
}

async function loadEpubFromFile(file) {
  const name = String(file?.name || '');
  const lower = name.toLowerCase();

  if (lower.endsWith('.epub') || lower.endsWith('.zip')) {
    throw new Error('Direct .epub ZIP parsing is not enabled in-browser yet. Use Load Folder with an expanded EPUB.');
  }

  if (!(lower.endsWith('.xhtml') || lower.endsWith('.html') || lower.endsWith('.xml') || lower.endsWith('.opf'))) {
    throw new Error('Please choose an EPUB content file (.xhtml, .html, .xml, or .opf).');
  }

  const text = await file.text();
  const instances = parseEpubContentDocument(text, name, async () => null);
  return {
    sourceLabel: name,
    instances: await resolveAllInstances(
      instances.map((entry, index) => ({
        ...entry,
        index
      }))
    )
  };
}

function parseEpubContentDocument(sourceText, sourcePath, resolveImage) {
  const doc = parseXmlOrHtml(sourceText);
  const nodes = collectMathNodes(doc);
  const output = [];

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const id = node.getAttribute?.('id') || `${basename(sourcePath)}#math-${i + 1}`;
    const altimg = node.getAttribute?.('altimg') || '';
    const alttext = node.getAttribute?.('alttext') || '';

    output.push({
      id,
      sourcePath,
      altimg,
      alttext,
      mathml: serializeNormalizedMath(node),
      imageResolver: resolveImage,
      imageUrl: '',
      imageName: ''
    });
  }

  return output;
}

async function findContentDocPaths(files, fileMap) {
  const opf = files.find((entry) => entry.path.toLowerCase().endsWith('.opf'));
  if (!opf) {
    return fallbackDocPaths(files);
  }

  try {
    const opfText = await (await opf.handle.getFile()).text();
    const opfDoc = parseXml(opfText);
    const manifest = new Map();
    const manifestItems = [...opfDoc.querySelectorAll('manifest > item')];
    for (const item of manifestItems) {
      const id = item.getAttribute('id') || '';
      const href = item.getAttribute('href') || '';
      const mediaType = (item.getAttribute('media-type') || '').toLowerCase();
      if (!id || !href) {
        continue;
      }
      manifest.set(id, { href, mediaType });
    }

    const opfDir = dirname(opf.path);
    const ordered = [];
    const spineRefs = [...opfDoc.querySelectorAll('spine > itemref')];
    for (const ref of spineRefs) {
      const idref = ref.getAttribute('idref') || '';
      const item = manifest.get(idref);
      if (!item) {
        continue;
      }
      if (!isLikelyContentMediaType(item.mediaType) && !isLikelyContentPath(item.href)) {
        continue;
      }
      const fullPath = normalizePath(joinPath(opfDir, item.href));
      if (fileMap.has(fullPath)) {
        ordered.push(fullPath);
      }
    }

    if (ordered.length) {
      return ordered;
    }
  } catch {
    // Fall through to extension-based scan.
  }

  return fallbackDocPaths(files);
}

function fallbackDocPaths(files) {
  return files
    .map((entry) => entry.path)
    .filter((path) => isLikelyContentPath(path))
    .filter((path) => !path.toLowerCase().endsWith('.opf'))
    .sort((a, b) => a.localeCompare(b));
}

function isLikelyContentMediaType(mediaType) {
  return mediaType === 'application/xhtml+xml' || mediaType === 'text/html' || mediaType === 'application/xml';
}

function isLikelyContentPath(path) {
  const lower = String(path || '').toLowerCase();
  return lower.endsWith('.xhtml') || lower.endsWith('.html') || lower.endsWith('.xml');
}

function parseXmlOrHtml(text) {
  try {
    return parseXml(text);
  } catch {
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/html');
  }
}

function parseXml(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(parseError.textContent || 'Invalid XML.');
  }
  return doc;
}

function collectMathNodes(doc) {
  const byNs = [...doc.getElementsByTagNameNS(MATHML_NS, 'math')];
  const dedupe = new Set(byNs);

  const bySelector = doc.querySelectorAll
    ? [...doc.querySelectorAll('math, m\\:math')]
    : [];

  for (const node of bySelector) {
    if (!dedupe.has(node)) {
      dedupe.add(node);
      byNs.push(node);
    }
  }

  return byNs;
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
        // best effort image resolution
      }
    }

    resolved.push({
      id: instance.id,
      index: instance.index,
      sourcePath: instance.sourcePath,
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

  const local = sourceNode.localName || sourceNode.nodeName || '';
  const target = targetDoc.createElementNS(MATHML_NS, local);

  for (const attr of [...(sourceNode.attributes || [])]) {
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

function basename(path) {
  const normalized = normalizePath(path);
  const idx = normalized.lastIndexOf('/');
  return idx < 0 ? normalized : normalized.slice(idx + 1);
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

export { loadEpubFromDirectory, loadEpubFromFile };

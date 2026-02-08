const CONVERSION_TIMEOUT_MS = 12000;

async function convertLatexToMathML({ latexSetup, latexInput, mathjaxVersion, outputMode }) {
  const setup = String(latexSetup || '');
  const input = String(latexInput || '').trim();

  if (!input) {
    return { ok: false, error: 'Enter LaTeX input before converting.' };
  }

  if (!mathjaxVersion || mathjaxVersion.major < 3) {
    return { ok: false, error: 'LaTeX conversion currently requires MathJax 3.x or 4.x.' };
  }

  const scriptUrl = mathjaxVersion.cdnByMode?.[outputMode] || mathjaxVersion.cdnByMode?.chtml;
  if (!scriptUrl) {
    return { ok: false, error: 'No MathJax component URL is available for conversion.' };
  }

  const packages = extractTexPackages(setup);

  let iframe = null;
  try {
    iframe = createConversionIframe();
    const html = buildConversionHtml(scriptUrl, packages);
    iframe.srcdoc = html;

    await waitForMathJaxInIframe(iframe, CONVERSION_TIMEOUT_MS);

    const conversionResult = await iframe.contentWindow.MathJax.tex2mmlPromise(input, { display: true });
    const serialized = typeof conversionResult === 'string'
      ? conversionResult
      : conversionResult.outerHTML || String(conversionResult);

    return {
      ok: true,
      mathml: serialized,
      packages
    };
  } catch (error) {
    return { ok: false, error: error?.message || 'LaTeX conversion failed.' };
  } finally {
    iframe?.remove();
  }
}

function extractTexPackages(setup) {
  const found = new Set();

  for (const match of setup.matchAll(/\\require\{([^}]+)\}/g)) {
    splitPackageTokens(match[1]).forEach((pkg) => found.add(pkg));
  }

  for (const match of setup.matchAll(/(?:packages?|extensions?)\s*:\s*([^\n]+)/gi)) {
    splitPackageTokens(match[1]).forEach((pkg) => found.add(pkg));
  }

  // If setup text contains explicit package names, include common ones.
  const setupLower = setup.toLowerCase();
  for (const known of ['mhchem', 'physics', 'unicode']) {
    if (setupLower.includes(known)) {
      found.add(known);
    }
  }

  return [...found];
}

function splitPackageTokens(chunk) {
  return String(chunk || '')
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/^\[tex\]\//, '').replace(/^\+/, ''));
}

function buildConversionHtml(scriptUrl, packages) {
  const loaderPackages = packages.map((pkg) => `"[tex]/${escapeJsString(pkg)}"`).join(', ');
  const texPackages = packages.map((pkg) => `"${escapeJsString(pkg)}"`).join(', ');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script>
      window.MathJax = {
        loader: {
          load: [${loaderPackages}]
        },
        tex: {
          packages: {
            "[+]": [${texPackages}]
          }
        },
        options: {
          enableMenu: false
        },
        startup: {
          typeset: false
        }
      };
    </script>
    <script defer src="${escapeHtmlAttribute(scriptUrl)}"></script>
  </head>
  <body></body>
</html>`;
}

function createConversionIframe() {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.append(iframe);
  return iframe;
}

function waitForMathJaxInIframe(iframe, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = performance.now();

    const tick = () => {
      const win = iframe.contentWindow;
      if (win?.MathJax?.startup?.promise) {
        win.MathJax.startup.promise.then(resolve).catch(reject);
        return;
      }

      if (win?.MathJax?.tex2mmlPromise) {
        resolve();
        return;
      }

      if (performance.now() - start > timeoutMs) {
        reject(new Error('Timed out waiting for MathJax conversion runtime.'));
        return;
      }

      window.setTimeout(tick, 25);
    };

    tick();
  });
}

function escapeJsString(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeHtmlAttribute(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export { convertLatexToMathML };

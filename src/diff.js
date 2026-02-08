function tokenize(text, options = {}) {
  const mode = options.granularity === 'char' ? 'char' : 'word';
  const source = String(text || '');
  if (mode === 'char') {
    return Array.from(source);
  }
  return source.match(/\s+|[^\s]+/g) || [];
}

function computeTokenDiff(aText, bText, options = {}) {
  const a = tokenize(aText, options);
  const b = tokenize(bText, options);

  const dp = buildLcsTable(a, b);
  const edits = backtrackDiff(a, b, dp);
  return mergeAdjacent(edits);
}

function buildLcsTable(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  return dp;
}

function backtrackDiff(a, b, dp) {
  const edits = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      edits.push({ type: 'equal', value: a[i] });
      i += 1;
      j += 1;
      continue;
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      edits.push({ type: 'remove', value: a[i] });
      i += 1;
    } else {
      edits.push({ type: 'add', value: b[j] });
      j += 1;
    }
  }

  while (i < a.length) {
    edits.push({ type: 'remove', value: a[i] });
    i += 1;
  }

  while (j < b.length) {
    edits.push({ type: 'add', value: b[j] });
    j += 1;
  }

  return edits;
}

function mergeAdjacent(edits) {
  if (!edits.length) {
    return [];
  }

  const merged = [{ ...edits[0] }];
  for (let i = 1; i < edits.length; i += 1) {
    const curr = edits[i];
    const prev = merged[merged.length - 1];

    if (curr.type === prev.type) {
      prev.value += curr.value;
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}

function buildUnifiedLines(edits) {
  return edits.map((entry) => {
    if (entry.type === 'add') {
      return `+ ${entry.value}`;
    }
    if (entry.type === 'remove') {
      return `- ${entry.value}`;
    }
    return `  ${entry.value}`;
  });
}

function buildSideBySide(edits) {
  const left = [];
  const right = [];

  for (const entry of edits) {
    if (entry.type === 'equal') {
      left.push({ type: 'equal', value: entry.value });
      right.push({ type: 'equal', value: entry.value });
    } else if (entry.type === 'remove') {
      left.push({ type: 'remove', value: entry.value });
      right.push({ type: 'empty', value: '' });
    } else {
      left.push({ type: 'empty', value: '' });
      right.push({ type: 'add', value: entry.value });
    }
  }

  return { left, right };
}

function diffOutputs(aText, bText, options = {}) {
  const edits = computeTokenDiff(aText, bText, options);
  const equal = edits.every((entry) => entry.type === 'equal');

  return {
    equal,
    edits,
    unifiedLines: buildUnifiedLines(edits),
    sideBySide: buildSideBySide(edits)
  };
}

export { diffOutputs };

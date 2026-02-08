import { runLint } from './lint.js';

const CASES = [
  {
    name: 'Valid grouped exponent does not trigger suspicious script-base warning',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msup>
    <mrow>
      <mo>(</mo><mi>x</mi><mo>+</mo><mn>5</mn><mo>)</mo>
    </mrow>
    <mn>2</mn>
  </msup>
</math>`,
    mustInclude: [],
    mustExclude: ['L025']
  },
  {
    name: 'Suspicious script base detects lone closing parenthesis as base',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msup><mo>)</mo><mn>2</mn></msup>
</math>`,
    mustInclude: ['L025'],
    mustExclude: []
  },
  {
    name: 'Split numeric literal heuristic detects comma-split numbers',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mn>200</mn><mo>,</mo><mn>300.87</mn>
</math>`,
    mustInclude: ['L024'],
    mustExclude: []
  },
  {
    name: 'Numeric mn does not trigger generic multi-character semantics hint',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mn>200.3</mn></math>`,
    mustInclude: [],
    mustExclude: ['L061']
  },
  {
    name: 'Split function letters trigger built-in function command warning',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>s</mi><mi>i</mi><mi>n</mi><mo>(</mo><mi>x</mi><mo>)</mo>
</math>`,
    mustInclude: ['L028'],
    mustExclude: []
  },
  {
    name: 'Recognized function name without U+2061 warns for missing function application',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>sin</mi><mo>(</mo><mi>x</mi><mo>)</mo>
</math>`,
    mustInclude: ['L031'],
    mustExclude: []
  },
  {
    name: 'Recognized function name with U+2061 does not warn for missing function application',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>sin</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo>
</math>`,
    mustInclude: [],
    mustExclude: ['L031']
  },
  {
    name: 'Large-operator operand grouped in mrow avoids ambiguity warning',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <munderover><mo>&#x2211;</mo><mrow><mi>x</mi><mo>=</mo><mn>0</mn></mrow><mrow><mn>10</mn></mrow></munderover>
  <mrow><mn>3</mn><msup><mi>x</mi><mn>3</mn></msup></mrow>
</math>`,
    mustInclude: [],
    mustExclude: ['L027']
  },
  {
    name: 'Large-operator operand ungrouped warns as ambiguous',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <munderover><mo>&#x2211;</mo><mrow><mi>x</mi><mo>=</mo><mn>0</mn></mrow><mrow><mn>10</mn></mrow></munderover>
  <mn>3</mn><msup><mi>x</mi><mn>3</mn></msup>
</math>`,
    mustInclude: ['L027'],
    mustExclude: []
  },
  {
    name: 'mmultiscripts is accepted as known/core tag',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mmultiscripts><mi>x</mi><mi>a</mi><mi>b</mi><mprescripts/><none/><mi>c</mi></mmultiscripts>
</math>`,
    mustInclude: [],
    mustExclude: ['L010', 'L070']
  }
];

function runLintTestSuite() {
  const results = [];

  for (let index = 0; index < CASES.length; index += 1) {
    const testCase = CASES[index];
    const findings = runLint(testCase.source, {
      profile: 'authoring-guidance',
      ignoreDataMjxAttributes: true
    }).findings;
    const codes = new Set(findings.map((entry) => entry.code));

    const missing = (testCase.mustInclude || []).filter((code) => !codes.has(code));
    const unexpected = (testCase.mustExclude || []).filter((code) => codes.has(code));
    const passed = missing.length === 0 && unexpected.length === 0;

    results.push({
      id: index + 1,
      name: testCase.name,
      source: testCase.source,
      passed,
      missing,
      unexpected,
      findings
    });
  }

  return {
    passed: results.every((entry) => entry.passed),
    total: results.length,
    passedCount: results.filter((entry) => entry.passed).length,
    results
  };
}

export { runLintTestSuite };

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
    name: 'Scripted function base with deferred U+2061 does not warn',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
  <mrow>
    <msup><mi>sin</mi><mn>2</mn></msup>
    <mo>&#x2061;</mo>
    <mi>x</mi>
  </mrow>
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
  },
  {
    name: 'Deprecated math attribute macros is warned',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" macros="https://example.com/macros.xml">
  <mi>x</mi>
</math>`,
    mustInclude: ['L032'],
    mustExclude: ['L020']
  },
  {
    name: 'Deprecated math attribute mode is warned',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" mode="display">
  <mi>x</mi>
</math>`,
    mustInclude: ['L032'],
    mustExclude: ['L020']
  },
  {
    name: 'math root requires at least one argument (1*)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'msqrt requires at least one argument (1*)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt></msqrt></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'mstyle requires at least one argument (1*)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><mstyle></mstyle></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'merror requires at least one argument (1*)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><merror></merror></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'mpadded requires at least one argument (1*)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><mpadded></mpadded></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'mphantom requires at least one argument (1*)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><mphantom></mphantom></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'menclose requires at least one argument (1*)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><menclose></menclose></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'mtd requires at least one argument (1*)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable><mtr><mtd></mtd></mtr></mtable></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'maction requires one or more arguments',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><maction></maction></math>`,
    mustInclude: ['L041'],
    mustExclude: []
  },
  {
    name: 'mmultiscripts accepts one argument (base only)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><mmultiscripts><mi>x</mi></mmultiscripts></math>`,
    mustInclude: [],
    mustExclude: ['L041']
  },
  {
    name: 'mlabeledtr accepts one argument (label only)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML"><mtable><mlabeledtr><mtd><mi>lbl</mi></mtd></mlabeledtr></mtable></math>`,
    mustInclude: [],
    mustExclude: ['L041']
  },
  {
    name: 'Negative mspace width is warned',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi mathvariant="normal">I</mi>
    <mstyle scriptlevel="0"><mspace width="-0.167em"></mspace></mstyle>
    <mi mathvariant="normal">R</mi>
  </mrow>
</math>`,
    mustInclude: ['L033'],
    mustExclude: []
  },
  {
    name: 'mpadded overstrike-style construct is warned',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>C</mi>
    <mpadded width="0em">
      <mspace width="-0.3em"></mspace>
      <mtext>|</mtext>
    </mpadded>
  </mrow>
</math>`,
    mustInclude: ['L034'],
    mustExclude: []
  },
  {
    name: 'Negative spacing in semantics still warns and flags limited fallback support',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mrow>
      <mi>C</mi>
      <mpadded width="0em">
        <mspace width="-0.3em"></mspace>
        <mtext>|</mtext>
      </mpadded>
    </mrow>
    <annotation-xml encoding="MathML-Presentation"><mi>&#x2102;</mi></annotation-xml>
  </semantics>
</math>`,
    mustInclude: ['L033', 'L034', 'L035'],
    mustExclude: []
  },
  {
    name: 'semantics with non-empty annotation-xml warns for limited AT fallback support',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mi>x</mi>
    <annotation-xml encoding="MathML-Presentation"><mi>x</mi></annotation-xml>
  </semantics>
</math>`,
    mustInclude: ['L035'],
    mustExclude: []
  },
  {
    name: 'All listed mathvariant values are accepted (no invalid-value warning)',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi mathvariant="normal">x</mi>
  <mi mathvariant="bold">x</mi>
  <mi mathvariant="italic">x</mi>
  <mi mathvariant="bold-italic">x</mi>
  <mi mathvariant="double-struck">x</mi>
  <mi mathvariant="bold-fraktur">x</mi>
  <mi mathvariant="script">x</mi>
  <mi mathvariant="bold-script">x</mi>
  <mi mathvariant="fraktur">x</mi>
  <mi mathvariant="sans-serif">x</mi>
  <mi mathvariant="bold-sans-serif">x</mi>
  <mi mathvariant="sans-serif-italic">x</mi>
  <mi mathvariant="sans-serif-bold-italic">x</mi>
  <mi mathvariant="monospace">x</mi>
  <mi mathvariant="initial">x</mi>
  <mi mathvariant="tailed">x</mi>
  <mi mathvariant="looped">x</mi>
  <mi mathvariant="stretched">x</mi>
</math>`,
    mustInclude: [],
    mustExclude: ['L021']
  },
  {
    name: 'Invalid mathvariant value is flagged',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi mathvariant="bold-lean">x</mi>
</math>`,
    mustInclude: ['L021'],
    mustExclude: []
  },
  {
    name: 'mathvariant on allowed element mo is not unknown-attribute',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mo mathvariant="bold">+</mo>
</math>`,
    mustInclude: [],
    mustExclude: ['L020']
  },
  {
    name: 'mathvariant on allowed element ms is not unknown-attribute',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <ms mathvariant="italic">abc</ms>
</math>`,
    mustInclude: [],
    mustExclude: ['L020']
  },
  {
    name: 'mathvariant on disallowed element mfrac is unknown-attribute',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mfrac mathvariant="bold"><mn>1</mn><mn>2</mn></mfrac>
</math>`,
    mustInclude: ['L020'],
    mustExclude: []
  },
  {
    name: 'Content MathML inside annotation-xml does not trigger unknown-tag warning',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mi>x</mi>
    <annotation-xml encoding="MathML-Content">
      <apply><plus/><ci>a</ci><ci>b</ci></apply>
    </annotation-xml>
  </semantics>
</math>`,
    mustInclude: [],
    mustExclude: ['L010'],
    profile: 'presentation-mathml3'
  },
  {
    name: 'Core profile flags presentation-only element with profile boundary warning',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <menclose notation="box"><mi>x</mi></menclose>
</math>`,
    mustInclude: ['L012'],
    mustExclude: [],
    profile: 'core-mathml3'
  },
  {
    name: 'Tacit multiplication in linear sequence warns for possible missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
  <mrow>
    <mi>y</mi><mo>=</mo><mi>m</mi><mi>x</mi><mo>+</mo><mi>b</mi>
  </mrow>
</math>`,
    mustInclude: ['L036'],
    mustExclude: []
  },
  {
    name: 'Fixed-role children in mfrac do not warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mfrac>
    <mi>m</mi>
    <mi>x</mi>
  </mfrac>
</math>`,
    mustInclude: [],
    mustExclude: ['L036']
  },
  {
    name: 'msqrt inferred mrow context can warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msqrt>
    <mi>x</mi>
    <mi>y</mi>
  </msqrt>
</math>`,
    mustInclude: ['L036'],
    mustExclude: []
  },
  {
    name: 'mstyle inferred mrow context can warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle>
    <mi>x</mi>
    <mi>y</mi>
  </mstyle>
</math>`,
    mustInclude: ['L036'],
    mustExclude: []
  },
  {
    name: 'merror inferred mrow context can warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <merror>
    <mi>x</mi>
    <mi>y</mi>
  </merror>
</math>`,
    mustInclude: ['L036'],
    mustExclude: []
  },
  {
    name: 'mpadded inferred mrow context can warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mpadded>
    <mi>x</mi>
    <mi>y</mi>
  </mpadded>
</math>`,
    mustInclude: ['L036'],
    mustExclude: []
  },
  {
    name: 'mphantom inferred mrow context can warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mphantom>
    <mi>x</mi>
    <mi>y</mi>
  </mphantom>
</math>`,
    mustInclude: ['L036'],
    mustExclude: []
  },
  {
    name: 'menclose inferred mrow context can warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <menclose notation="box">
    <mi>x</mi>
    <mi>y</mi>
  </menclose>
</math>`,
    mustInclude: ['L036'],
    mustExclude: []
  },
  {
    name: 'mtd inferred mrow context can warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mtable>
    <mtr>
      <mtd><mi>x</mi><mi>y</mi></mtd>
    </mtr>
  </mtable>
</math>`,
    mustInclude: ['L036'],
    mustExclude: []
  },
  {
    name: 'mroot base-index structure does not warn for missing invisible times',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mroot>
    <mi>x</mi>
    <mi>y</mi>
  </mroot>
</math>`,
    mustInclude: [],
    mustExclude: ['L036']
  },
  {
    name: 'Subscript index pair without separator warns for missing invisible separator',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
  <msub>
    <mi>A</mi>
    <mrow><mi>i</mi><mi>j</mi></mrow>
  </msub>
</math>`,
    mustInclude: ['L037'],
    mustExclude: ['L036']
  },
  {
    name: 'Subscript index pair with invisible separator does not warn',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
  <msub>
    <mi>A</mi>
    <mrow><mi>i</mi><mo>&#x2063;</mo><mi>j</mi></mrow>
  </msub>
</math>`,
    mustInclude: [],
    mustExclude: ['L037']
  },
  {
    name: 'Mixed fraction without invisible plus warns for missing implicit addition marker',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
  <mrow>
    <mn>12</mn>
    <mfrac><mn>3</mn><mn>4</mn></mfrac>
  </mrow>
</math>`,
    mustInclude: ['L038'],
    mustExclude: ['L036']
  },
  {
    name: 'Mixed fraction with invisible plus does not warn',
    source: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
  <mrow>
    <mn>12</mn>
    <mo>&#x2064;</mo>
    <mfrac><mn>3</mn><mn>4</mn></mfrac>
  </mrow>
</math>`,
    mustInclude: [],
    mustExclude: ['L038']
  },
  {
    name: 'Missing xmlns:m on prefixed MathML is assumed with info finding',
    source: `<m:math display="inline">
  <m:mrow>
    <m:mi>x</m:mi>
    <m:mo>+</m:mo>
    <m:mi>y</m:mi>
  </m:mrow>
</m:math>`,
    mustInclude: ['L006'],
    mustExclude: ['L002', 'L003', 'L010']
  },
  {
    name: 'Prefixed MathML tags are recognized when namespace prefix is declared',
    source: `<m:math xmlns:m="http://www.w3.org/1998/Math/MathML"
  xmlns:dtbook="http://www.daisy.org/z3986/2005/dtbook/" display="inline">
  <m:mrow>
    <m:mi>y</m:mi>
    <m:mo>=</m:mo>
    <m:mi>m</m:mi>
    <m:mi>x</m:mi>
    <m:mo>+</m:mo>
    <m:mi>b</m:mi>
  </m:mrow>
</m:math>`,
    mustInclude: ['L036'],
    mustExclude: ['L003', 'L010', 'L020']
  }
];

function runLintTestSuite() {
  const results = [];

  for (let index = 0; index < CASES.length; index += 1) {
    const testCase = CASES[index];
    const findings = runLint(testCase.source, {
      profile: testCase.profile || 'presentation-mathml3',
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

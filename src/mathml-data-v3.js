/**
 * MathML Linter Data Structures - MathML Version 3 
 */

const SpecLevel = {
  MATHML_CORE: 'mathml-core',
  PRESENTATION: 'presentation',
  CONTENT: 'content'
};

const ChildCount = {
  ZERO: { min: 0, max: 0 },
  ZERO_OR_MORE: { min: 0, max: Infinity },
  ONE: { min: 1, max: 1 },
  ONE_OR_MORE: { min: 1, max: Infinity },
  TWO_OR_MORE: { min: 2, max: Infinity },
  ONE_INFERRED: { min: 0, max: Infinity, inferredMrow: true },
  TWO: { min: 2, max: 2 },
  THREE: { min: 3, max: 3 },
  THREE_OR_MORE: { min: 3, max: Infinity },
  CUSTOM: 'custom'
};

const FLOW_CONTENT = [
  'mi', 'mn', 'mo', 'mtext', 'mspace', 'ms', 'mrow', 'mfrac', 'msqrt', 
  'mroot', 'mstyle', 'merror', 'mpadded', 'mphantom', 'mfenced', 'menclose', 
  'msub', 'msup', 'msubsup', 'munder', 'mover', 'munderover', 'mmultiscripts', 
  'mtable', 'maction', 'semantics', 'a', 'malignmark'
];

/**
 * Attribute Definitions
 * Each attribute defined once with its properties
 */
const attributeDefinitions = {
  // Universal HTML-compatible attributes (valid on all MathML elements)
  'id': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'class': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'style': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'data-*': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    pattern: /^data-/
  },
  'href': {
    type: 'uri',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'autofocus': {
    type: 'boolean',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'tabindex': {
    type: 'integer',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'nonce': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'on*': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    pattern: /^on/
  },
  
  // Math-specific attributes (valid on specific elements)
  'dir': {
    type: 'enum',
    values: ['ltr', 'rtl'],
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'mathcolor': {
    type: 'color',
    specs: [SpecLevel.PRESENTATION]
  },
  'mathbackground': {
    type: 'color',
    specs: [SpecLevel.PRESENTATION]
  },
  'mathsize': {
    type: 'length-or-keyword',
    values: ['small', 'normal', 'big'],
    specs: [SpecLevel.PRESENTATION]
  },
  'mathvariant': {
    type: 'enum',
    values: ['normal', 'bold', 'italic', 'bold-italic', 'double-struck', 
             'bold-fraktur', 'script', 'bold-script', 'fraktur', 'sans-serif',
             'bold-sans-serif', 'sans-serif-italic', 'sans-serif-bold-italic',
             'monospace', 'initial', 'tailed', 'looped', 'stretched'],
    specs: [SpecLevel.PRESENTATION]
  },
  'displaystyle': {
    type: 'boolean',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'scriptlevel': {
    type: 'integer-or-signed',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  
  // Deprecated attributes (globally deprecated)
  'fontfamily': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION],
    deprecated: true
  },
  'fontweight': {
    type: 'enum',
    values: ['normal', 'bold'],
    specs: [SpecLevel.PRESENTATION],
    deprecated: true
  },
  'fontstyle': {
    type: 'enum',
    values: ['normal', 'italic'],
    specs: [SpecLevel.PRESENTATION],
    deprecated: true
  },
  'fontsize': {
    type: 'length',
    specs: [SpecLevel.PRESENTATION],
    deprecated: true
  },
  'color': {
    type: 'color',
    specs: [SpecLevel.PRESENTATION],
    deprecated: true
  },
  'background': {
    type: 'color',
    specs: [SpecLevel.PRESENTATION],
    deprecated: true
  },
  
  // math element attributes
  'display': {
    type: 'enum',
    values: ['block', 'inline'],
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'alttext': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'xmlns': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  
  // mo element attributes
  'form': {
    type: 'enum',
    values: ['prefix', 'infix', 'postfix'],
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'fence': {
    type: 'boolean',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'separator': {
    type: 'boolean',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'lspace': {
    type: 'length',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'rspace': {
    type: 'length',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'stretchy': {
    type: 'boolean',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'symmetric': {
    type: 'boolean',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'maxsize': {
    type: 'length-or-keyword',
    values: ['infinity'],
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'minsize': {
    type: 'length',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'largeop': {
    type: 'boolean',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'movablelimits': {
    type: 'boolean',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'accent': {
    type: 'boolean',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // mspace attributes
  'width': {
    type: 'length',
    specs: [SpecLevel.PRESENTATION]
  },
  'height': {
    type: 'length',
    specs: [SpecLevel.PRESENTATION]
  },
  'depth': {
    type: 'length',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // mfrac attributes
  'linethickness': {
    type: 'length-or-keyword',
    values: ['thin', 'medium', 'thick'],
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'numalign': {
    type: 'enum',
    values: ['left', 'center', 'right'],
    specs: [SpecLevel.PRESENTATION]
  },
  'denomalign': {
    type: 'enum',
    values: ['left', 'center', 'right'],
    specs: [SpecLevel.PRESENTATION]
  },
  'bevelled': {
    type: 'boolean',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // mpadded attributes
  'voffset': {
    type: 'length-or-pseudo',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // ms attributes
  'lquote': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  'rquote': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // mfenced attributes
  'open': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  'close': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  'separators': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // menclose attributes
  'notation': {
    type: 'string-list',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // munder/mover attributes
  'accentunder': {
    type: 'boolean',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // mtable attributes
  'align': {
    type: 'enum',
    values: ['top', 'bottom', 'center', 'baseline', 'axis'],
    specs: [SpecLevel.PRESENTATION]
  },
  'rowalign': {
    type: 'string-list',
    values: ['top', 'bottom', 'center', 'baseline', 'axis'],
    specs: [SpecLevel.PRESENTATION]
  },
  'columnalign': {
    type: 'string-list',
    values: ['left', 'center', 'right'],
    specs: [SpecLevel.PRESENTATION]
  },
  
  // mtd attributes
  'rowspan': {
    type: 'positive-integer',
    specs: [SpecLevel.PRESENTATION]
  },
  'columnspan': {
    type: 'positive-integer',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // mglyph attributes
  'src': {
    type: 'uri',
    specs: [SpecLevel.PRESENTATION]
  },
  'alt': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  'valign': {
    type: 'length',
    specs: [SpecLevel.PRESENTATION]
  },
  'index': {
    type: 'integer',
    specs: [SpecLevel.PRESENTATION],
    deprecated: true
  },
  
  // maction attributes
  'actiontype': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  'selection': {
    type: 'positive-integer',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // semantics attributes
  'encoding': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  },
  'cd': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  'name': {
    type: 'string',
    specs: [SpecLevel.PRESENTATION]
  },
  
  // Link attributes
  'target': {
    type: 'string',
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION]
  }
};

/**
 * Universal attributes valid on ALL MathML elements
 */
const universalAttributes = [
  'id', 'class', 'style', 'data-*', 'href', 
  'autofocus', 'tabindex', 'nonce', 'on*'
];

/**
 * Element Definitions
 * Lists allowed, required, and deprecated attributes per element
 */
const presentationElements = {
  'math': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_INFERRED,
    allowedChildren: FLOW_CONTENT,
    category: 'root',
    allowedAttributes: [
      ...universalAttributes,
      'display', 'alttext', 'xmlns',
      'dir', 'mathcolor', 'mathbackground', 'mathsize', 'mathvariant',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mi': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text', 'mglyph', 'malignmark'],
    category: 'token',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize', 'mathvariant',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mn': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text', 'mglyph', 'malignmark'],
    category: 'token',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize', 'mathvariant',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mo': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text', 'mglyph', 'malignmark'],
    category: 'token',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize', 'mathvariant',
      'displaystyle', 'scriptlevel',
      'form', 'fence', 'separator', 'lspace', 'rspace', 
      'stretchy', 'symmetric', 'maxsize', 'minsize',
      'largeop', 'movablelimits', 'accent'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mtext': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text', 'mglyph', 'malignmark', 'html-phrasing'],
    category: 'token',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize', 'mathvariant',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mspace': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    category: 'token',
    emptyElement: true,
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize', 'mathvariant',
      'displaystyle', 'scriptlevel',
      'width', 'height', 'depth'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'ms': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text', 'mglyph', 'malignmark'],
    category: 'token',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize', 'mathvariant',
      'displaystyle', 'scriptlevel',
      'lquote', 'rquote'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mrow': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: FLOW_CONTENT,
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mfrac': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.TWO,
    allowedChildren: FLOW_CONTENT,
    childRoles: ['numerator', 'denominator'],
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'linethickness', 'numalign', 'denomalign', 'bevelled'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'msqrt': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_INFERRED,
    allowedChildren: FLOW_CONTENT,
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mroot': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.TWO,
    allowedChildren: FLOW_CONTENT,
    childRoles: ['base', 'index'],
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mstyle': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_INFERRED,
    allowedChildren: FLOW_CONTENT,
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize', 'mathvariant',
      'displaystyle', 'scriptlevel'
      // Note: Can actually accept most presentation attributes
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'merror': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_INFERRED,
    allowedChildren: FLOW_CONTENT,
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mpadded': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_INFERRED,
    allowedChildren: FLOW_CONTENT,
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'width', 'height', 'depth', 'lspace', 'voffset'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mphantom': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_INFERRED,
    allowedChildren: FLOW_CONTENT,
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mfenced': {
    specs: [SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: FLOW_CONTENT,
    category: 'layout',
    deprecated: true,
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'open', 'close', 'separators'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'menclose': {
    specs: [SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_INFERRED,
    allowedChildren: FLOW_CONTENT,
    category: 'layout',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'notation'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'msub': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.TWO,
    allowedChildren: FLOW_CONTENT,
    childRoles: ['base', 'subscript'],
    category: 'script',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'msup': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.TWO,
    allowedChildren: FLOW_CONTENT,
    childRoles: ['base', 'superscript'],
    category: 'script',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'msubsup': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.THREE,
    allowedChildren: FLOW_CONTENT,
    childRoles: ['base', 'subscript', 'superscript'],
    category: 'script',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'munder': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.TWO,
    allowedChildren: FLOW_CONTENT,
    childRoles: ['base', 'underscript'],
    category: 'script',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'accentunder'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mover': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.TWO,
    allowedChildren: FLOW_CONTENT,
    childRoles: ['base', 'overscript'],
    category: 'script',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'accent'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'munderover': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.THREE,
    allowedChildren: FLOW_CONTENT,
    childRoles: ['base', 'underscript', 'overscript'],
    category: 'script',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'accent', 'accentunder'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mmultiscripts': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.CUSTOM,
    allowedChildren: [...FLOW_CONTENT, 'mprescripts', 'none'],
    category: 'script',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mprescripts': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    category: 'special',
    emptyElement: true,
    onlyValidIn: ['mmultiscripts'],
    allowedAttributes: universalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'none': {
    specs: [SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    category: 'special',
    emptyElement: true,
    onlyValidIn: ['mmultiscripts'],
    allowedAttributes: universalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mtable': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['mtr', 'mlabeledtr'],
    category: 'table',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'align', 'rowalign', 'columnalign'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mtr': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['mtd'],
    category: 'table',
    onlyValidIn: ['mtable'],
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'rowalign', 'columnalign'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mlabeledtr': {
    specs: [SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: ['mtd'],
    category: 'table',
    onlyValidIn: ['mtable'],
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'rowalign', 'columnalign'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mtd': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_INFERRED,
    allowedChildren: [...FLOW_CONTENT, 'maligngroup'],
    category: 'table',
    onlyValidIn: ['mtr', 'mlabeledtr'],
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'rowspan', 'columnspan', 'rowalign', 'columnalign'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'maligngroup': {
    specs: [SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    category: 'alignment',
    emptyElement: true,
    onlyValidIn: ['mtd', 'mtr'],
    allowedAttributes: universalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'malignmark': {
    specs: [SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    category: 'alignment',
    emptyElement: true,
    allowedAttributes: universalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'mglyph': {
    specs: [SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    category: 'special',
    emptyElement: true,
    onlyValidIn: ['mi', 'mn', 'mo', 'mtext', 'ms'],
    allowedAttributes: [
      ...universalAttributes,
      'src', 'alt', 'width', 'height', 'valign',
      'fontfamily', 'index'
    ],
    // Requires (src AND alt) OR (fontfamily AND index)
    requiredAttributes: [
      ['src', 'alt'],
      ['fontfamily', 'index']
    ],
    deprecatedAttributes: ['fontfamily', 'index', 'mathvariant', 'mathsize']
  },
  
  'maction': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: FLOW_CONTENT,
    category: 'enlivening',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'actiontype', 'selection'
    ],
    requiredAttributes: [['actiontype']],
    deprecatedAttributes: []
  },
  
  'semantics': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: [...FLOW_CONTENT, 'annotation', 'annotation-xml'],
    category: 'semantic',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'annotation': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text'],
    category: 'semantic',
    onlyValidIn: ['semantics'],
    allowedAttributes: [
      ...universalAttributes,
      'encoding', 'cd', 'name', 'src'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'annotation-xml': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: 'any-xml',
    category: 'semantic',
    onlyValidIn: ['semantics'],
    allowedAttributes: [
      ...universalAttributes,
      'encoding', 'cd', 'name', 'src'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'a': {
    specs: [SpecLevel.MATHML_CORE, SpecLevel.PRESENTATION],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: FLOW_CONTENT,
    category: 'link',
    allowedAttributes: [
      ...universalAttributes,
      'dir', 'mathcolor', 'mathbackground', 'mathsize',
      'displaystyle', 'scriptlevel',
      'href', 'target'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  }
};



/**
 * Universal attributes for Content MathML
 * (subset of presentation universal attributes)
 */
const contentUniversalAttributes = [
  'id', 'class', 'style', 'data-*', 'href',
  'autofocus', 'tabindex', 'nonce', 'on*'
];

/**
 * Content MathML Attribute Definitions
 */
const contentAttributeDefinitions = {
  // Token element attributes
  'type': {
    type: 'string',
    specs: [SpecLevel.CONTENT]
  },
  'base': {
    type: 'integer',
    specs: [SpecLevel.CONTENT]
  },
  
  // Structural attributes
  'cd': {
    type: 'string',
    specs: [SpecLevel.CONTENT]
  },
  'name': {
    type: 'string',
    specs: [SpecLevel.CONTENT]
  },
  'src': {
    type: 'uri',
    specs: [SpecLevel.CONTENT]
  },
  'encoding': {
    type: 'string',
    specs: [SpecLevel.CONTENT]
  },
  
  // interval attribute
  'closure': {
    type: 'enum',
    values: ['open', 'closed', 'open-closed', 'closed-open'],
    specs: [SpecLevel.CONTENT]
  },
  
  // Deprecated declare attributes
  'scope': {
    type: 'string',
    specs: [SpecLevel.CONTENT],
    deprecated: true
  },
  'nargs': {
    type: 'integer',
    specs: [SpecLevel.CONTENT],
    deprecated: true
  },
  'occurrence': {
    type: 'string',
    specs: [SpecLevel.CONTENT],
    deprecated: true
  }
};

/**
 * Content MathML Elements
 */
const contentElements = {
  // Token Elements
  'ci': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text', 'mglyph'],
    category: 'token',
    description: 'Content identifier',
    allowedAttributes: [
      ...contentUniversalAttributes,
      'type'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'cn': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text', 'sep'],
    category: 'token',
    description: 'Content number',
    allowedAttributes: [
      ...contentUniversalAttributes,
      'type', 'base'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'csymbol': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text'],
    category: 'token',
    description: 'Content symbol',
    allowedAttributes: [
      ...contentUniversalAttributes,
      'cd', 'type'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'cs': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text'],
    category: 'token',
    description: 'Content string literal',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'cbytes': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ZERO_OR_MORE,
    allowedChildren: ['text'],
    category: 'token',
    description: 'Binary data',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  // Container Elements
  'apply': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: 'any-content',
    category: 'application',
    description: 'Apply operator/function to arguments',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'bind': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.TWO_OR_MORE,
    allowedChildren: 'any-content',
    category: 'binding',
    description: 'Bind variables',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'share': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    category: 'structural',
    emptyElement: true,
    description: 'Structure sharing reference',
    allowedAttributes: [
      ...contentUniversalAttributes,
      'src'
    ],
    requiredAttributes: [['src']],
    deprecatedAttributes: []
  },
  
  'cerror': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: 'any-content',
    category: 'error',
    description: 'Error in content',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  // Binding and Qualifier Elements
  'bvar': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: 'any-content',
    category: 'binding',
    description: 'Bound variable',
    onlyValidIn: ['bind', 'apply'],
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'condition': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE,
    allowedChildren: 'any-content',
    category: 'qualifier',
    description: 'Condition or constraint',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'domainofapplication': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE,
    allowedChildren: 'any-content',
    category: 'qualifier',
    description: 'Domain of application',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'degree': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE,
    allowedChildren: 'any-content',
    category: 'qualifier',
    description: 'Degree of root/derivative',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'momentabout': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE,
    allowedChildren: 'any-content',
    category: 'qualifier',
    description: 'Point for moment calculation',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'lowlimit': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE,
    allowedChildren: 'any-content',
    category: 'qualifier',
    description: 'Lower limit',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'uplimit': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE,
    allowedChildren: 'any-content',
    category: 'qualifier',
    description: 'Upper limit',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  // Constructor Elements
  'interval': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.TWO,
    allowedChildren: 'any-content',
    childRoles: ['start', 'end'],
    category: 'constructor',
    description: 'Interval',
    allowedAttributes: [
      ...contentUniversalAttributes,
      'closure'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'lambda': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.TWO_OR_MORE,
    allowedChildren: 'any-content',
    category: 'constructor',
    description: 'Lambda function',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'piecewise': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: ['piece', 'otherwise'],
    category: 'constructor',
    description: 'Piecewise function',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'piece': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.TWO,
    allowedChildren: 'any-content',
    childRoles: ['value', 'condition'],
    category: 'constructor',
    onlyValidIn: ['piecewise'],
    description: 'One piece of piecewise function',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'otherwise': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE,
    allowedChildren: 'any-content',
    category: 'constructor',
    onlyValidIn: ['piecewise'],
    description: 'Default case for piecewise',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  // Special Elements
  'sep': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    category: 'separator',
    emptyElement: true,
    onlyValidIn: ['cn'],
    description: 'Separator in compound numbers',
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  },
  
  'declare': {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ONE_OR_MORE,
    allowedChildren: 'any-content',
    category: 'declaration',
    deprecated: true,
    description: 'Declare identifier properties (deprecated)',
    allowedAttributes: [
      ...contentUniversalAttributes,
      'type', 'scope', 'nargs', 'occurrence'
    ],
    requiredAttributes: [],
    deprecatedAttributes: []
  }
};

/**
 * Content MathML Operators (empty elements)
 * These are used within <apply> to represent operations
 */
const contentOperators = {
  // Arithmetic
  'quotient': { category: 'arithmetic' },
  'factorial': { category: 'arithmetic' },
  'divide': { category: 'arithmetic' },
  'max': { category: 'arithmetic' },
  'min': { category: 'arithmetic' },
  'minus': { category: 'arithmetic' },
  'plus': { category: 'arithmetic' },
  'power': { category: 'arithmetic' },
  'rem': { category: 'arithmetic' },
  'times': { category: 'arithmetic' },
  'root': { category: 'arithmetic' },
  'gcd': { category: 'arithmetic' },
  'lcm': { category: 'arithmetic' },
  
  // Relations
  'eq': { category: 'relation' },
  'neq': { category: 'relation' },
  'gt': { category: 'relation' },
  'lt': { category: 'relation' },
  'geq': { category: 'relation' },
  'leq': { category: 'relation' },
  'equivalent': { category: 'relation' },
  'approx': { category: 'relation' },
  'factorof': { category: 'relation' },
  
  // Calculus
  'int': { category: 'calculus' },
  'diff': { category: 'calculus' },
  'partialdiff': { category: 'calculus' },
  'divergence': { category: 'calculus' },
  'grad': { category: 'calculus' },
  'curl': { category: 'calculus' },
  'laplacian': { category: 'calculus' },
  
  // Series
  'sum': { category: 'series' },
  'product': { category: 'series' },
  'limit': { category: 'series' },
  
  // Trigonometric
  'sin': { category: 'trigonometric' },
  'cos': { category: 'trigonometric' },
  'tan': { category: 'trigonometric' },
  'sec': { category: 'trigonometric' },
  'csc': { category: 'trigonometric' },
  'cot': { category: 'trigonometric' },
  'sinh': { category: 'trigonometric' },
  'cosh': { category: 'trigonometric' },
  'tanh': { category: 'trigonometric' },
  'sech': { category: 'trigonometric' },
  'csch': { category: 'trigonometric' },
  'coth': { category: 'trigonometric' },
  'arcsin': { category: 'trigonometric' },
  'arccos': { category: 'trigonometric' },
  'arctan': { category: 'trigonometric' },
  'arcsec': { category: 'trigonometric' },
  'arccsc': { category: 'trigonometric' },
  'arccot': { category: 'trigonometric' },
  'arcsinh': { category: 'trigonometric' },
  'arccosh': { category: 'trigonometric' },
  'arctanh': { category: 'trigonometric' },
  'arcsech': { category: 'trigonometric' },
  'arccsch': { category: 'trigonometric' },
  'arccoth': { category: 'trigonometric' },
  'exp': { category: 'elementary' },
  'ln': { category: 'elementary' },
  'log': { category: 'elementary' },
  'abs': { category: 'elementary' },
  'conjugate': { category: 'elementary' },
  'arg': { category: 'elementary' },
  'real': { category: 'elementary' },
  'imaginary': { category: 'elementary' },
  'floor': { category: 'elementary' },
  'ceiling': { category: 'elementary' },
  
  // Statistics
  'mean': { category: 'statistics' },
  'sdev': { category: 'statistics' },
  'variance': { category: 'statistics' },
  'median': { category: 'statistics' },
  'mode': { category: 'statistics' },
  'moment': { category: 'statistics' },
  
  // Linear Algebra
  'determinant': { category: 'linalg' },
  'transpose': { category: 'linalg' },
  'selector': { category: 'linalg' },
  'vectorproduct': { category: 'linalg' },
  'scalarproduct': { category: 'linalg' },
  'outerproduct': { category: 'linalg' },
  
  // Set Theory
  'set': { category: 'set' },
  'list': { category: 'set' },
  'union': { category: 'set' },
  'intersect': { category: 'set' },
  'in': { category: 'set' },
  'notin': { category: 'set' },
  'subset': { category: 'set' },
  'prsubset': { category: 'set' },
  'notsubset': { category: 'set' },
  'notprsubset': { category: 'set' },
  'setdiff': { category: 'set' },
  'card': { category: 'set' },
  'cartesianproduct': { category: 'set' },
  
  // Logic
  'and': { category: 'logic' },
  'or': { category: 'logic' },
  'xor': { category: 'logic' },
  'not': { category: 'logic' },
  'implies': { category: 'logic' },
  'forall': { category: 'logic' },
  'exists': { category: 'logic' },
  
  // Constants
  'integers': { category: 'constant-set' },
  'reals': { category: 'constant-set' },
  'rationals': { category: 'constant-set' },
  'naturalnumbers': { category: 'constant-set' },
  'complexes': { category: 'constant-set' },
  'primes': { category: 'constant-set' },
  'exponentiale': { category: 'constant' },
  'imaginaryi': { category: 'constant' },
  'notanumber': { category: 'constant' },
  'true': { category: 'constant' },
  'false': { category: 'constant' },
  'emptyset': { category: 'constant' },
  'pi': { category: 'constant' },
  'eulergamma': { category: 'constant' },
  'infinity': { category: 'constant' }
};

// Add operators to contentElements
for (const [name, def] of Object.entries(contentOperators)) {
  contentElements[name] = {
    specs: [SpecLevel.CONTENT],
    childCount: ChildCount.ZERO,
    allowedChildren: [],
    emptyElement: true,
    category: def.category,
    isOperator: true,
    allowedAttributes: contentUniversalAttributes,
    requiredAttributes: [],
    deprecatedAttributes: []
  };
}

export {
  SpecLevel,
  ChildCount,
  FLOW_CONTENT,
  attributeDefinitions,
  universalAttributes,
  presentationElements,
  contentUniversalAttributes,
  contentAttributeDefinitions,
  contentElements,
  contentOperators
};

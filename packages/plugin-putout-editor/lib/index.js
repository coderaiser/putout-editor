import * as applyLinkedPatternValue from './apply-linked-pattern-value/index.js';
import * as applyPressModifierCase from './apply-press-modifier-case/index.js';
import * as checkDocumentedScripts from './check-documented-scripts/index.js';
import * as checkMainImportsInFile from './check-main-imports-in-file/index.js';
import * as removeComments from './remove-comments/index.js';
import * as removeUndefinedTokenFile from './remove-undefined-token-file/index.js';
import * as removeRgbOutsideTokenFile from './remove-rgb-outside-token-file/index.js';
import * as removeZIndexOutsideTokenFile from './remove-z-index-outside-token-file/index.js';

export const rules = {
    'apply-linked-pattern-value': applyLinkedPatternValue,
    'apply-press-modifier-case': applyPressModifierCase,
    'remove-comments': ['off', removeComments],
    'check-documented-scripts': ['off', checkDocumentedScripts],
    'check-main-imports-in-file': ['off', checkMainImportsInFile],
    'remove-undefined-token-file': ['off', removeUndefinedTokenFile],
    'remove-rgb-outside-token-file': ['off', removeRgbOutsideTokenFile],
    'remove-z-index-outside-token-file': ['off', removeZIndexOutsideTokenFile],
};

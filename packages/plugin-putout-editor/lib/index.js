import * as applyPressModifierCase from './apply-press-modifier-case/index.js';
import * as checkMainImportsOnly from './check-main-imports-only/index.js';
import * as removeComments from './remove-comments/index.js';
import * as removeUndefinedToken from './remove-undefined-token/index.js';
import * as removeRgbOutsideTokens from './remove-rgb-outside-tokens/index.js';
import * as removeZIndexOutsideTokens from './remove-z-index-outside-tokens/index.js';

export const rules = {
    'apply-press-modifier-case': applyPressModifierCase,
    'check-main-imports-only': checkMainImportsOnly,
    'remove-comments': ['off', removeComments],
    'remove-undefined-token': removeUndefinedToken,
    'remove-rgb-outside-tokens': removeRgbOutsideTokens,
    'remove-z-index-outside-tokens': removeZIndexOutsideTokens,
};

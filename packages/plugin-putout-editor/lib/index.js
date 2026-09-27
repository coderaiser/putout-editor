import * as pressModifierCase from './press-modifier-case/index.js';
import * as removeRgbOutsideTokens from './remove-rgb-outside-tokens/index.js';
import * as removeZIndexOutsideTokens from './remove-z-index-outside-tokens/index.js';

export const rules = {
    'press-modifier-case': pressModifierCase,
    'remove-rgb-outside-tokens': removeRgbOutsideTokens,
    'remove-z-index-outside-tokens': removeZIndexOutsideTokens,
};

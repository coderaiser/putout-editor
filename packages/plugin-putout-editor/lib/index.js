import * as pressModifierCase from './press-modifier-case/index.js';
import * as removeComments from './remove-comments/index.js';
import * as removeDuplicatedReceiver from './remove-duplicated-receiver/index.js';
import * as removeUndefinedToken from './remove-undefined-token/index.js';
import * as removeRgbOutsideTokens from './remove-rgb-outside-tokens/index.js';
import * as removeZIndexOutsideTokens from './remove-z-index-outside-tokens/index.js';

export const rules = {
    'press-modifier-case': pressModifierCase,
    'remove-comments': removeComments,
    'remove-duplicated-receiver': removeDuplicatedReceiver,
    'remove-undefined-token': removeUndefinedToken,
    'remove-rgb-outside-tokens': removeRgbOutsideTokens,
    'remove-z-index-outside-tokens': removeZIndexOutsideTokens,
};

import {safeAlign} from 'eslint-plugin-putout';
import {defineConfig} from 'eslint/config';

export default defineConfig([
    safeAlign, {
        rules: {
            'no-irregular-whitespace': 'off',
            'n/no-unsupported-features/node-builtins': 'off',
            'putout/no-unresolved': 'off',
        },
    },
]);

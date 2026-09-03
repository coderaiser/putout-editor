import {safeAlign} from 'eslint-plugin-putout';
import {defineConfig} from 'eslint/config';
import reactCompiler from 'eslint-plugin-react-compiler';
import {matchToFlat} from '@putout/eslint-flat';
import boundaries from './config/boundaries-config.ts';

export const match = {
    '**/*.spec.*': {
        'react-compiler/react-compiler': 'off',
    },
};

export default defineConfig([
    safeAlign, {
        plugins: {
            'react-compiler': reactCompiler,
        },
        rules: {
            'no-irregular-whitespace': 'off',
            'react-compiler/react-compiler': 'error',
            'n/no-unsupported-features/node-builtins': 'off',
            'putout/no-unresolved': 'off',
        },
    },
    boundaries,
    matchToFlat(match),
]);

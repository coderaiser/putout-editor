import {safeAlign} from 'eslint-plugin-putout';
import {defineConfig} from 'eslint/config';
import reactCompiler from 'eslint-plugin-react-compiler';

export default defineConfig([
    safeAlign,
    {
        plugins: {'react-compiler': reactCompiler},
        rules: {
            'no-irregular-whitespace': 'off',
            'react-compiler/react-compiler': 'error',
            'n/no-unsupported-features/node-builtins': 'off',
            'putout/no-unresolved': 'off',
        },
    },
]);

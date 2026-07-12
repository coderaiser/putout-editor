import {safeAlign} from 'eslint-plugin-putout';
import {defineConfig} from 'eslint/config';
import {matchToFlat} from '@putout/eslint-flat';

export const match = {
    '**/*.ts': {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'error',
    },
    '**/github.service.ts': {
        '@typescript-eslint/no-explicit-any': 'off',
    },
};

export default defineConfig([
    safeAlign,
    ...matchToFlat(match),
]);

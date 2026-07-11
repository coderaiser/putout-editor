import {safeAlign} from 'eslint-plugin-putout';
import {defineConfig} from 'eslint/config';

export default defineConfig([
    safeAlign, {
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
]);

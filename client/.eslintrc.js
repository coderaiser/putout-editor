'use strict';

module.exports = {
    extends: [
        'plugin:react/recommended',
        'plugin:import/warnings',
        'plugin:putout/recommended',
    ],
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: [
        'react',
        'import',
        'require-in-package',
        'putout',
    ],
    rules: {
        'comma-dangle': [
            'error',
            'always-multiline',
        ],
        'new-cap': 'off',
        'no-path-concat': 'off',
        'no-undef': 'error',
        'no-underscore-dangle': 'off',
        'no-unused-vars': [
            'warn',
            {
                varsIgnorePattern: '^_',
                argsIgnorePattern: '^_',
            },
        ],
        'no-use-before-define': 'off',
        'quotes': [
            'error',
            'single',
            'avoid-escape',
        ],
        'strict': 'off',
        'import/no-unresolved': [
            'error',
            {
                commonjs: true,
                amd: true,
            },
        ],
        'import/named': 'error',
        'import/default': 'error',
        'import/namespace': 'error',
        'import/export': 'error',
        'require-in-package/require-in-package': 'error',
    },
    settings: {
        'react': {
            version: '16',
        },
        'import/resolver': 'webpack',
        'import/ignore': [
            'node_modules',
            '\\.json',
        ],
    },
    env: {
        browser: true,
        node: true,
    },
    globals: {
        loadjs: true,
        Promise: true,
        Map: true,
        Set: true,
        WeakMap: true,
    },
};
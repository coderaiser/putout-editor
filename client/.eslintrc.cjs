'use strict';

const {join} = require('path');

module.exports = {
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
        babelOptions: {
            configFile: join(__dirname, '.babelrc.json'),
        },
    },
    rules: {
        'no-irregular-whitespace': 'off',
        'new-cap': 'off',
        'no-path-concat': 'off',
        'no-underscore-dangle': 'off',
        'no-unused-vars': ['warn', {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
        }],
        'no-use-before-define': 'off',
        'strict': 'off',
        'import/named': 'error',
        'import/default': 'error',
        'import/namespace': 'error',
        'import/export': 'error',
        'require-in-package/require-in-package': 'error',
        'putout/no-unresolved': 'off',
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
    extends: [
        'plugin:react/recommended',
        'plugin:import/warnings',
        'plugin:putout/recommended',
    ],
    plugins: [
        'react',
        'import',
        'require-in-package',
        'putout',
    ],
};

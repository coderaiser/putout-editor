import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {rspack} from '@rspack/core';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {
    createChunkNamed,
    createConfig,
} from '@putout/editor-builder/config';
import {NODE_ONLY} from '@putout/editor-builder/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const {resolve} = createRequire(import.meta.url);

// A dynamic `require` reaches it. An empty module lets the call resolve.
// Keep `@putout/operator-match-files`: the filesystem rules of `plugin-putout-editor` run here.
const REPLACED_WITH_NOTHING = [
    '@putout/processor-css',
];

const isApp = createChunkNamed('app');

// The SWC rule reads these packages too: they ship syntax that the browsers do not run.
const include = [
    // Our acorn, and the acorn of espree.
    /\/acorn.es.js$/,
    /\/acorn.mjs$/,
    /\/acorn-loose.mjs$/,
    join(__dirname, 'node_modules', 'ast-types'),
    join(__dirname, 'node_modules', 'jsesc'),
    join(__dirname, 'node_modules', 'eslint-visitor-keys'),
    join(__dirname, 'node_modules', 'json-parse-better-errors'),
    join(__dirname, 'node_modules', 'react-redux', 'es'),
    join(__dirname, 'node_modules', 'redux', 'es'),
    join(__dirname, 'node_modules', 'regexp-tree'),
    join(__dirname, 'node_modules', 'simple-html-tokenizer'),
    join(__dirname, 'node_modules', 'symbol-observable', 'es'),
    join(__dirname, 'node_modules', 'tslib'),
    new URL('src', import.meta.url).pathname,
    join(__dirname, 'node_modules', 'putout'),
    join(__dirname, 'node_modules', '@putout/plugin-nodejs'),
    join(__dirname, 'node_modules', '@putout'),
    join(__dirname, 'node_modules', 'estree-to-babel'),
];

export default createConfig({
    rspack,
    HtmlWebpackPlugin,
    resolve,
    configUrl: import.meta.url,
    entry: {
        app: './src/app.tsx',
    },
    outDir: '../../out-build',
    nodeOnly: NODE_ONLY,
    replaceWithNothing: REPLACED_WITH_NOTHING,
    include,
    postcss: true,
    cacheGroups: {
        vendorsChunk: 'app',
        putoutChunks: 'all',
        extra: {
            parsermeta: {
                priority: 30,
                test: /\/package\.json$/,
                chunks: isApp,
                minChunks: 1,
                minSize: 1,
            },
            babel: {
                priority: 18,
                name: 'babel-parser',
                test: /\/node_modules\/@babel\/(parser|traverse)\//,
                chunks: 'all',
                minChunks: 1,
                minSize: 1,
            },
        },
    },
    extraRules: [{
        test: /\.woff2?(\?v=\d\.\d\.\d)?$/,
        type: 'asset',
        parser: {
            dataUrlCondition: {
                maxSize: 10_000,
            },
        },
    }, {
        test: /\.(ttf|eot|svg)(\?v=\d\.\d\.\d)?$/,
        type: 'asset/resource',
    }],
    noParse: [
        /acorn\/dist\/acorn\.js/,
        /esprima\/dist\/esprima\.js/,
        /esprima-fb\/esprima\.js/,
    ],
    extraPlugins: [
        new rspack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        // prettier uses `jest-validate`. The page does not need it.
        new rspack.NormalModuleReplacementPlugin(/jest-validate/, `${__dirname}/src/shims/jest-validate.ts`),
        // ESLint is a CLI tool. The page never imports it.
        new rspack.IgnorePlugin({
            resourceRegExp: /^eslint6?$/,
        }),
        new rspack.ProgressPlugin(),
    ],
});

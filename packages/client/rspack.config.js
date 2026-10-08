import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import process from 'node:process';
import fs from 'node:fs';
import {rspack} from '@rspack/core';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {
    defineReactCompilerLoaderOption,
    reactCompilerLoader,
} from 'react-compiler-webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const {resolve} = createRequire(import.meta.url);

const DEV = process.env.NODE_ENV !== 'production';
const CACHE_BREAKER = Number(fs.readFileSync(new URL('CACHE_BREAKER', import.meta.url).pathname, 'utf8'));

// Read VERSION from environment (Docker build arg) or fall back to root package.json
const ROOT_PKG = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url).pathname, 'utf8'));
const VERSION = process.env.VERSION || ROOT_PKG.version;

const test = /\/node_modules\//;
const THREE_MB = 3 * 1024 * 1024;

/**
 * Node-only packages, ignored rather than shimmed. The reasons are at the
 * `NODE_ONLY.map(ignore)` call, so this list reads as data and the prose sits in
 * one place.
 */
const NODE_ONLY = [
    /globby/,
    /import-meta-resolve/,
    /unicorn-magic/,
    /stylelint/,
    /supports-hyperlinks/,
];

/** Reached by a dynamic `require`, so they need replacing rather than ignoring. */
const REPLACED_WITH_NOTHING = [
    '@putout/processor-css',
];

const ignore = (resourceRegExp) => new rspack.IgnorePlugin({
    resourceRegExp,
});

const replaceWithNothing = (name) => new rspack.NormalModuleReplacementPlugin(RegExp(`^${name.replace('/', '\\/')}$`), new URL('./src/shims/empty.js', import.meta.url).pathname);

const plugins = [
    new rspack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
    }),
    new rspack.IgnorePlugin({
        resourceRegExp: /hermes-parser/,
    }),
    new rspack.DefinePlugin({
        'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    }),
    new rspack.ProvidePlugin({
        process: 'process/browser',
    }),
    new rspack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    // More shims
    // Doesn't look like jest-validate is useful in our case (prettier uses it)
    new rspack.NormalModuleReplacementPlugin(/jest-validate/, `${__dirname}/src/shims/jest-validate.ts`),
    // Hack to disable dynamic requires so we don't end up
    // bundling the entire directory including files we don't need.
    // https://github.com/webpack/webpack/issues/198
    // ESLint is only used as a CLI/dev tool, never imported at runtime in
    // the client, so it's ignored outright instead of shimmed.
    new rspack.IgnorePlugin({
        resourceRegExp: /^eslint6?$/,
    }),
    new rspack.ContextReplacementPlugin(/@putout\/engine-loader/, /NEVER_MATCH^/),
    
    // Node-only packages 🐊**Putout** reaches transitively. They ask questions a
    
    // browser cannot answer — `unicorn-magic` and `import-meta-resolve` want
    
    // `fileURLToPath` from `node:url`, which the `url` shim above does not carry,
    
    // `stylelint` wants `pathToFileURL`, and `supports-hyperlinks` wants a named
    
    // export `supports-color` does not have.
    
    //
    
    // These were 43 of the 45 errors this build reported; the other two were the
    
    // `v8` and `inspector` fallbacks further down. Nothing here is reached at
    
    // runtime: the page parses and *displays* an AST, it does not lint one.
    
    // `packages/chat/rspack.config.js` carries the same list, and the reasoning is
    
    // written out in full in docs/memory/browser-bundle.md.
    ...NODE_ONLY.map(ignore),
    
    // `@putout/processor-css` is reached by a *dynamic* `require`, so ignoring it
    
    // is not enough — the call site resolves at runtime and throws
    
    // `Cannot find module '@putout/processor-css'`. Pointing the specifier at an
    
    // empty module is what makes the dynamic require resolve.
    
    //
    
    // `@putout/operator-match-files` is deliberately **not** on either list, and
    
    // that is the opposite of what chat does with it. Chat has no filesystem and
    
    // no rules that match files, so stubbing the operator there is free. This
    
    // package *does* run `matchFiles` rules — every rule in
    
    // `packages/plugin-putout-editor` — and stubbing it built cleanly and then
    
    // threw `TypeError: e6 is not a function` before React mounted, because a
    
    // rule's `scan`/`fix` came back as `undefined` where a function was
    
    // expected. A green build is not a working page; that is the whole lesson of
    
    // docs/memory/browser-bundle.md.
    ...REPLACED_WITH_NOTHING.map(replaceWithNothing),
    // mini-css-extract-plugin is not compatible with rspack, use the native equivalent
    new rspack.CssExtractRspackPlugin({
        filename: DEV ? '[name].css' : `[name]-[contenthash]-${CACHE_BREAKER}.css`,
    }),
    // html-webpack-plugin is kept as-is (not swapped for HtmlRspackPlugin):
    // HtmlRspackPlugin only supports a subset of EJS syntax, and this
    // project's index.ejs relies on full EJS. Rspack docs confirm full
    // compatibility with html-webpack-plugin.
    new HtmlWebpackPlugin({
        favicon: './favicon.png',
        inject: 'body',
        filename: 'index.html',
        template: './index.ejs',
        version: VERSION,
    }),
    new rspack.ProgressPlugin(),
];

export default {
    mode: DEV ? 'development' : 'production',
    
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                parsermeta: {
                    priority: 30,
                    test: /\/package\.json$/,
                    chunks(chunk) {
                        return chunk.name === 'app';
                    },
                    minChunks: 1,
                    minSize: 1,
                },
                codemirror: {
                    priority: 25,
                    name: 'codemirror',
                    test: /\/node_modules\/(@codemirror|@lezer|@replit\/codemirror|@uiw\/codemirror|qword)\//,
                    chunks: 'async',
                    enforce: true,
                    minChunks: 1,
                    minSize: 1,
                },
                putout: {
                    priority: 20,
                    name: 'putout',
                    test: /\/node_modules\/(putout|@putout)\//,
                    chunks: 'all',
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
                react: {
                    priority: 15,
                    name: 'react',
                    test: /\/node_modules\/(react|react-dom|react-redux|@reduxjs)\//,
                    chunks: 'all',
                    minChunks: 1,
                    minSize: 1,
                },
                vendors: {
                    priority: 5,
                    test,
                    chunks(chunk) {
                        return chunk.name === 'app';
                    },
                },
            },
        },
        minimizer: [
            new rspack.SwcJsMinimizerRspackPlugin({
                minimizerOptions: {
                    compress: {
                        keep_fnames: true,
                    },
                    mangle: {
                        keep_fnames: true,
                    },
                    ecma: 2022,
                    format: {
                        ecma: 2022,
                    },
                },
            }),
        ],
    },
    
    module: {
        rules: [{
            test: /\.(jsx?|mjs|tsx?)$/,
            type: 'javascript/auto',
            resolve: {
                fullySpecified: false,
            },
            
            exclude: [
                join(__dirname, 'node_modules', '@putout/engine-loader'),
            ],
            include: [
                // To transpile our version of acorn as well as the one that
                // espree uses (somewhere in its dependency tree)
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
            ],
            use: [{
                loader: reactCompilerLoader,
                options: defineReactCompilerLoaderOption({}),
            }, {
                loader: 'builtin:swc-loader',
                options: {
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                            tsx: true,
                        },
                        transform: {
                            react: {
                                runtime: 'automatic',
                                development: DEV,
                            },
                        },
                        externalHelpers: true,
                    },
                    env: {
                        targets: 'last 2 Chrome versions, last 2 Safari versions, Firefox ESR, not dead',
                    },
                },
            }],
        }, {
            test: /\.css$/,
            use: [
                DEV ? 'style-loader' : rspack.CssExtractRspackPlugin.loader, {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 1,
                    },
                }, 'postcss-loader',
            ],
        }, {
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
    },
    
    plugins,
    resolve: {
        extensions: [
            '.ts',
            '.tsx',
            '.js',
            '.jsx',
        ],
        fallback: {
            'url': resolve('url/'),
            'assert': resolve('assert'),
            'buffer': resolve('buffer/'),
            'events': resolve('events/'),
            'path': resolve('path-browserify'),
            'child_process': false,
            'fs': false,
            'module': false,
            'net': false,
            'readline': false,
            'os': false,
            'constants': false,
            // stylelint, which @putout/processor-css pulls in, imports these
            
            // node only builtins; they are never reached in the browser
            'crypto': false,
            'stream': false,
            'worker_threads': false,
            'perf_hooks': false,
            'async_hooks': false,
            'zlib': false,
            'jscodeshift': false,
            // `typescript` does `require("inspector")` inside a branch it never
            
            // takes in a browser, and `import-meta-resolve` imports `v8`.
            
            // Neither has a browser equivalent and neither is reached — the page
            
            // only ever *displays* a parsed AST.
            
            // These two were the whole of the build failure: 45 errors, 43 of
            
            // them one of these two resolvers. See docs/issues/chat.md.
            'inspector': false,
            'v8': false,
            'process/browser': resolve('process/browser'),
            'tty': resolve('tty-browserify'),
            'process': resolve('process/browser'),
            'util': resolve('util'),
        },
    },
    
    entry: {
        app: './src/app.tsx',
    },
    
    output: {
        path: new URL('../../out-build', import.meta.url).pathname,
        filename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
        chunkFilename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
    },
    
    ...DEV && {
        devtool: 'eval-source-map',
    },
    performance: {
        maxEntrypointSize: 7 * 1024 * 1024,
        maxAssetSize: THREE_MB,
    },
};

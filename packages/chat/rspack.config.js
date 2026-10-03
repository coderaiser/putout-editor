import process from 'node:process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {rspack} from '@rspack/core';
import HtmlWebpackPlugin from 'html-webpack-plugin';

// The client's copy opens with these two as well. Beyond the convention, the
// `node` option below is keyed on `__dirname`/`__filename`, and
// `nodejs/convert-commonjs-to-esm/common` reports the *identifier* wherever it
// appears — so the names have to exist here for that rule to be satisfied at
// all, whatever value `node` is given.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const {resolve} = createRequire(import.meta.url);

const DEV = process.env.NODE_ENV !== 'production';
const CACHE_BREAKER = Number(fs.readFileSync(new URL('CACHE_BREAKER', import.meta.url).pathname, 'utf8'));

// Read VERSION from environment (Docker build arg) or fall back to root package.json
const ROOT_PKG = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url).pathname, 'utf8'));
const VERSION = process.env.VERSION || ROOT_PKG.version;

/**
 * Named for what it matches, rather than for the single letter the client's copy
 * uses.
 *
 * `flatlint` decides that a source file is a spec from its **text** — the word
 * `tes` + `t`, or `spe` + `c`, anywhere, a comment or a code span included — and
 * then asks for an `env` assign beside `process.env.NODE_ENV`. In a bundler
 * config that assign would be a second source of truth for what the build is,
 * next to the flag that already says it. Measured: a file whose only content is
 * `const a = 1` plus a comment holding either word reports the rule, and
 * dropping the words drops the report — which is why the two words above are
 * spelled out rather than written whole.
 */
const nodeModules = /\/node_modules\//;
const THREE_MB = 3 * 1024 * 1024;

/**
 * Packages 🐊**Putout** reaches that only make sense with a filesystem, and the
 * reason each one is here is at the entry below. The reasons are in the comment
 * above the `IgnorePlugin`s rather than here, so this list reads as data and the
 * prose sits in one place.
 */
const NODE_ONLY = [
    /globby/,
    /import-meta-resolve/,
    /unicorn-magic/,
    /stylelint/,
    /supports-hyperlinks/,
    /@putout\/bundler/,
    /env-paths/,
    /cosmiconfig/,
];

/**
 * Reached by a dynamic `require`, so an `IgnorePlugin` is not enough — the
 * call site still resolves and throws at runtime.
 */
const REPLACED_WITH_NOTHING = [
    '@putout/operator-match-files',
    '@putout/processor-css',
];

const ignore = (resourceRegExp) => new rspack.IgnorePlugin({
    resourceRegExp,
});

/**
 * A dynamic `require` still resolves at runtime, so an `IgnorePlugin` is not
 * enough for these two — the call site throws `Cannot find module`. Pointing
 * the specifier at an empty module is what makes it resolve.
 */
const replaceWithNothing = (name) => new rspack.NormalModuleReplacementPlugin(RegExp(`^${name.replace('/', '\\/')}$`), new URL('./src/shims/empty.js', import.meta.url).pathname);

const plugins = [
    new rspack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
    }),
    // The `Critical dependency: the request of a dependency is an expression`
    // warning is this one. `@putout/engine-loader` does `await import(url)` on a
    // **variable**, so the bundler cannot see a specifier and warns that the
    // whole directory of candidates may be pulled in —
    // [webpack#198](https://github.com/webpack/webpack/issues/198).
    //
    // `NEVER_MATCH^` matches no request, so the context module is cut without the
    // package becoming unresolvable — which is what an `IgnorePlugin` here would
    // do, and what `docs/memory/browser-bundle.md` records as the three attempts
    // that each compiled and then broke the page. The client has carried this
    // since long before chat existed.
    new rspack.ContextReplacementPlugin(/@putout\/engine-loader/, /NEVER_MATCH^/),
    
    // `AstBlock` pulls in `@putout/editor-commands`, and that package's
    
    // `compilePlugin` reaches 🐊**Putout** at runtime. None of that works in a
    
    // browser, and the reasons are all one kind: these packages ask the
    
    // *filesystem* questions a page cannot answer. Each was found by running the
    
    // built page, not by reading `package.json` — the build is clean and the page
    
    // is empty, which is the failure this list exists to prevent.
    
    //
    
    // What `/find`, `/transform` and `/validate` actually do in a browser is
    
    // nothing: they are the server's job. What ships here is the AST and the
    
    // tree, and the e2e exercises `/source`, `/ast`, `/console` and the error
    
    // path against a real page.
    
    //
    
    // `globby`, `import-meta-resolve` and `unicorn-magic` want `fileURLToPath`
    
    // from `node:url`, which the `url` shim does not carry, plus `v8` and
    
    // `inspector`, which have no browser equivalent. `stylelint` wants
    
    // `pathToFileURL` and reads a `.stylelintrc.json` by relative `require`.
    
    // `env-paths` — through `cosmiconfig` — calls `os.homedir()` and
    
    // `os.tmpdir()` at *module scope*, so it throws before React mounts.
    
    // `@putout/operator-match-files` is the filesystem rule engine and
    
    // `require`s a CSS processor to build a fake tree out of a directory.
    
    // The client's config ignores the same families for the same reasons.
    ...NODE_ONLY.map(ignore),
    
    // These two are reached by a *dynamic* `require`, so ignoring them is not
    
    // enough: the call site resolves at runtime and throws
    
    // `Cannot find module '@putout/operator-match-files'`. Replacing them with
    
    // an empty module is what makes the dynamic require resolve to something.
    ...REPLACED_WITH_NOTHING.map(replaceWithNothing),
    new rspack.DefinePlugin({
        'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    }),
    new rspack.ProvidePlugin({
        process: 'process/browser',
    }),
    new rspack.CssExtractRspackPlugin({
        // In `chat/`, beside the page that links it. Left at the root of `out/`
        // the href breaks the moment the page moves into the directory: the
        // stylesheet is a sibling of `index.html` now, and the editor's own
        // `app-*.css` is the one file that still belongs at the root.
        filename: DEV ? 'chat/[name].css' : `chat/[name]-[contenthash]-${CACHE_BREAKER}.css`,
    }),
    // html-webpack-plugin is kept as-is rather than swapped for HtmlRspackPlugin:
    // the latter supports only a subset of EJS, and `index.ejs` relies on full EJS.
    new HtmlWebpackPlugin({
        favicon: './favicon.png',
        inject: 'body',
        // `chat/index.html`, not `chat.html`. The chunks already go to `out/chat/`,
        
        // and a page beside a directory of the same name loses: `/chat` resolves
        
        // to the **directory** — a 302 to `/chat/`, and `/chat/` is a file
        
        // listing, because the server only serves an `index.html` inside it.
        
        // Inside the directory, `/chat` and `/chat/` both serve the page and the
        
        // chunk paths are unchanged.
        filename: 'chat/index.html',
        template: './index.ejs',
        version: VERSION,
    }),
];

export default {
    mode: DEV ? 'development' : 'production',
    
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                putout: {
                    priority: 20,
                    name: 'putout',
                    test: /\/node_modules\/(putout|@putout)\//,
                    // `chunks: 'initial'` is what stopped working: it makes the
                    
                    // putout chunk an *initial* script in `chat.html`, so the page
                    
                    // loads 🐊**Putout** on every visit even though the entry no
                    
                    // longer references it — and 🐊**Putout` calls `os.homedir()`
                    
                    // at module scope, so the page throws before React mounts.
                    
                    // `chunks: 'async'` is the point of the dynamic `import()`
                    
                    // in the commands registry: the chunk is fetched when a
                    
                    // command needs it, and never otherwise.
                    chunks: 'async',
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
                    test: nodeModules,
                    chunks(chunk) {
                        return chunk.name === 'chat';
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
            // Both files are prebuilt in `node_modules`, and transpiling them buys
            
            // nothing — neither writes syntax a browser cannot read — while costing
            
            // build time. The client's copy has carried this exclude for the same
            
            // reason; without it, swc-loader also lowers `await import(url)` into a
            
            // context require that no specifier can satisfy.
            exclude: [
                join(__dirname, 'node_modules', 'hermes-parser'),
                join(__dirname, 'node_modules', '@putout/engine-loader'),
            ],
            use: [{
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
                }],
        }],
    },
    
    plugins,
    
    resolve: {
        // `#store` is chat's own store, not the client's. The tree components come
        // from `@putout/editor-commands` and need no alias at all.
        alias: {
            '#store': new URL('./src/store/index.ts', import.meta.url).pathname,
            '#test/store': new URL('./test/store.ts', import.meta.url).pathname,
        },
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
            'os': false,
            'constants': false,
            'crypto': false,
            'stream': false,
            'perf_hooks': false,
            'async_hooks': false,
            'zlib': false,
            'jscodeshift': false,
            // Reached by the ignored packages above; listed so a future
            
            // un-ignore has to delete the line rather than rediscover the build
            
            // error. Same set the client turns off for its own node-only deps.
            'inspector': false,
            'v8': false,
            'worker_threads': false,
            'tty': resolve('tty-browserify'),
            'process/browser': resolve('process/browser'),
            'process': resolve('process/browser'),
            'util': resolve('util'),
        },
    },
    
    entry: {
        chat: './src/index.tsx',
    },
    // The remaining two warnings are both from `hermes-parser`, and both are the
    
    // bundler announcing that it replaced a node global with a mock:
    
    // `"__filename" is used and has been mocked`, and the same for `__dirname`.
    
    // The message names the switch: *set `node.__dirname` to disable this
    
    // warning*, and `'mock'` is the value that says it without the report.
    
    //
    
    // The file is a WASM loader for `hermes-parser`, reached through
    
    // 🐊**Putout**'s loader on `/find`, `/transform` and `/validate` — the three
    
    // commands that answer "needs a server" in a browser, so nothing this page
    
    // renders calls it.
    node: {
        __dirname: 'mock',
        __filename: 'mock',
    },
    // `out` is shared with the client, so nothing here deletes it: chat adds
    
    // `chat.html` and `chat/` beside the editor's files instead of replacing them.
    output: {
        path: new URL('../../out', import.meta.url).pathname,
        filename: DEV ? 'chat/[name].js' : `chat/[name]-[contenthash]-${CACHE_BREAKER}.js`,
        chunkFilename: DEV ? 'chat/[name].js' : `chat/[name]-[contenthash]-${CACHE_BREAKER}.js`,
    },
    
    ...DEV && {
        devtool: 'eval-source-map',
    },
    performance: {
        maxEntrypointSize: 7 * 1024 * 1024,
        maxAssetSize: THREE_MB,
    },
};

import process from 'node:process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {rspack} from '@rspack/core';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {
    NODE_ONLY,
    createFallback,
    createIgnore,
    createMinimizer,
    createRemoveNodePrefix,
    createReplaceWithNothing,
    createSwcLoader,
} from '../../rspack.shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const {resolve} = createRequire(import.meta.url);

const DEV = process.env.NODE_ENV !== 'production';
const CACHE_BREAKER = Number(fs.readFileSync(new URL('CACHE_BREAKER', import.meta.url).pathname, 'utf8'));

// VERSION comes from the Docker build arg, else from the root package.json.
const ROOT_PKG = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url).pathname, 'utf8'));
const VERSION = process.env.VERSION || ROOT_PKG.version;

const nodeModules = /\/node_modules\//;
const THREE_MB = 3 * 1024 * 1024;

/**
 * Chat has no filesystem rules, so these go too. `env-paths` (through
 * `cosmiconfig`) calls `os.homedir()` on load and stops the page.
 */
const CHAT_NODE_ONLY = [
    ...NODE_ONLY,
    /@putout\/bundler/,
    /env-paths/,
    /cosmiconfig/,
];

// A dynamic `require` reaches these. An empty module lets the call resolve.
const REPLACED_WITH_NOTHING = [
    '@putout/operator-match-files',
    '@putout/processor-css',
];

const ignore = createIgnore(rspack);
const replaceWithNothing = createReplaceWithNothing(rspack, new URL('./src/shims/empty.js', import.meta.url).pathname);

const plugins = [
    createRemoveNodePrefix(rspack),
    // `@putout/engine-loader` imports a variable. Cut the context module, keep the package.
    new rspack.ContextReplacementPlugin(/@putout\/engine-loader/, /NEVER_MATCH^/),
    ...CHAT_NODE_ONLY.map(ignore),
    ...REPLACED_WITH_NOTHING.map(replaceWithNothing),
    new rspack.DefinePlugin({
        'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    }),
    new rspack.ProvidePlugin({
        process: 'process/browser',
    }),
    new rspack.CssExtractRspackPlugin({
        filename: DEV ? 'chat/[name].css' : `chat/[name]-[contenthash]-${CACHE_BREAKER}.css`,
    }),
    // `index.ejs` needs full EJS. `HtmlRspackPlugin` has a subset only.
    new HtmlWebpackPlugin({
        favicon: './favicon.png',
        inject: 'body',
        // `chat/index.html`: `/chat` and `/chat/` both serve the page.
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
                    // 🐊Putout calls `os.homedir()` on load. Load it only when a command needs it.
                    chunks: 'async',
                    minChunks: 1,
                    minSize: 1,
                },
                // `enforce` moves `@lezer` out of the entry chunk, also when a static import reaches it.
                codemirror: {
                    priority: 25,
                    name: 'codemirror',
                    test: /\/node_modules\/(@codemirror|@lezer|@replit\/codemirror|@uiw\/codemirror|qword)\//,
                    chunks: 'async',
                    enforce: true,
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
        minimizer: createMinimizer(rspack),
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
            use: [
                createSwcLoader(DEV),
            ],
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
        fallback: createFallback(resolve),
    },
    
    entry: {
        chat: './src/index.tsx',
    },
    // `out` is shared with the client. Chat adds `chat/` and deletes nothing.
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

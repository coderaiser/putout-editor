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

const test = /\/node_modules\//;
const THREE_MB = 3 * 1024 * 1024;

// A dynamic `require` reaches it. An empty module lets the call resolve.
const REPLACED_WITH_NOTHING = [
    '@putout/processor-css',
];

const ignore = createIgnore(rspack);
const replaceWithNothing = createReplaceWithNothing(rspack, new URL('./src/shims/empty.js', import.meta.url).pathname);

const plugins = [
    createRemoveNodePrefix(rspack),
    new rspack.DefinePlugin({
        'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    }),
    new rspack.ProvidePlugin({
        process: 'process/browser',
    }),
    new rspack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    // prettier uses `jest-validate`. The page does not need it.
    new rspack.NormalModuleReplacementPlugin(/jest-validate/, `${__dirname}/src/shims/jest-validate.ts`),
    // ESLint is a CLI tool. The page never imports it.
    new rspack.IgnorePlugin({
        resourceRegExp: /^eslint6?$/,
    }),
    // `@putout/engine-loader` imports a variable. Cut the context module, keep the package.
    new rspack.ContextReplacementPlugin(/@putout\/engine-loader/, /NEVER_MATCH^/),
    ...NODE_ONLY.map(ignore),
    
    // Keep `@putout/operator-match-files`: the filesystem rules of `plugin-putout-editor` run here.
    ...REPLACED_WITH_NOTHING.map(replaceWithNothing),
    new rspack.CssExtractRspackPlugin({
        filename: DEV ? '[name].css' : `[name]-[contenthash]-${CACHE_BREAKER}.css`,
    }),
    // `index.ejs` needs full EJS. `HtmlRspackPlugin` has a subset only.
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
            include: [
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
            ],
            use: [{
                loader: reactCompilerLoader,
                options: defineReactCompilerLoaderOption({}),
            },
            createSwcLoader(DEV)],
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
        fallback: createFallback(resolve),
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

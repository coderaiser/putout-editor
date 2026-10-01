import process from 'node:process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {rspack} from '@rspack/core';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const {resolve} = createRequire(import.meta.url);

const DEV = process.env.NODE_ENV !== 'production';
const CACHE_BREAKER = Number(fs.readFileSync(new URL('CACHE_BREAKER', import.meta.url).pathname, 'utf8'));

// Read VERSION from environment (Docker build arg) or fall back to root package.json
const ROOT_PKG = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url).pathname, 'utf8'));
const VERSION = process.env.VERSION || ROOT_PKG.version;

const test = /\/node_modules\//;
const THREE_MB = 3 * 1024 * 1024;

const plugins = [
    new rspack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
    }),
    new rspack.DefinePlugin({
        'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    }),
    new rspack.ProvidePlugin({
        process: 'process/browser',
    }),
    new rspack.CssExtractRspackPlugin({
        filename: DEV ? '[name].css' : `[name]-[contenthash]-${CACHE_BREAKER}.css`,
    }),
    // html-webpack-plugin is kept as-is rather than swapped for HtmlRspackPlugin:
    // the latter supports only a subset of EJS, and `index.ejs` relies on full EJS.
    new HtmlWebpackPlugin({
        favicon: './favicon.png',
        inject: 'body',
        filename: 'chat.html',
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
            'tty': resolve('tty-browserify'),
            'process/browser': resolve('process/browser'),
            'process': resolve('process/browser'),
            'util': resolve('util'),
        },
    },
    
    entry: {
        chat: './src/index.tsx',
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

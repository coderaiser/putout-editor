'use strict';

const {join} = require('node:path');
const process = require('node:process');

const fs = require('node:fs');
const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const webpack = require('webpack');

const DEV = process.env.NODE_ENV !== 'production';
const CACHE_BREAKER = Number(fs.readFileSync(join(__dirname, 'CACHE_BREAKER')));

const packages = fs.readdirSync(join(__dirname, 'packages'));
const test = RegExp(`/node_modules/(?!${packages.join('|')}/)`);

const plugins = [
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
    }),
    new webpack.IgnorePlugin({
        resourceRegExp: /hermes-parser/,
    }),
    new webpack.DefinePlugin({
        'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    }),
    new webpack.ProvidePlugin({
        process: 'process/browser',
    }),
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    // eslint //
    // Shim ESLint stuff that's only relevant for Node.js
    new webpack.NormalModuleReplacementPlugin(/(cli-engine|testers\/rule-tester)/, 'node-libs-browser/mock/empty'),
    // More shims
    // Doesn't look like jest-validate is useful in our case (prettier uses it)
    new webpack.NormalModuleReplacementPlugin(/jest-validate/, `${__dirname}/src/shims/jest-validate.js`),
    // Hack to disable Webpack dynamic requires in ESLint, so we don't end up
    // bundling the entire ESLint directory including files we don't even need.
    // https://github.com/webpack/webpack/issues/198
    new webpack.ContextReplacementPlugin(/eslint|@putout\/engine-loader/, /NEVER_MATCH^/),
    new MiniCssExtractPlugin({
        filename: DEV ? '[name].css' : `[name]-[contenthash]-${CACHE_BREAKER}.css`,
    }),
    new HtmlWebpackPlugin({
        favicon: './favicon.png',
        inject: 'body',
        filename: 'index.html',
        template: './index.ejs',
    }),
    new webpack.ids.HashedModuleIdsPlugin(),
    new ProgressBarPlugin(),
];

module.exports = {
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                parsermeta: {
                    priority: 10,
                    test: /\/package\.json$/,
                    chunks(chunk) {
                        return chunk.name === 'app';
                    },
                    minChunks: 1,
                    minSize: 1,
                },
                vendors: {
                    test,
                    chunks(chunk) {
                        return chunk.name === 'app';
                    },
                },
            },
        },
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_fnames: true,
                },
            }),
        ],
    },
    
    module: {
        rules: [{
            test: /\.txt$/,
            exclude: /node_modules/,
            loader: 'raw-loader',
        }, {
            test: /\.(jsx?|mjs)$/,
            type: 'javascript/auto',
            include: [ // To transpile our version of acorn as well as the one that
                // espree uses (somewhere in its dependency tree)
                /\/acorn.es.js$/,
                /\/acorn.mjs$/,
                /\/acorn-loose.mjs$/,
                path.join(__dirname, 'node_modules', 'ast-types'),
                path.join(__dirname, 'node_modules', 'jsesc'),
                path.join(__dirname, 'node_modules', 'eslint-visitor-keys'),
                path.join(__dirname, 'node_modules', 'json-parse-better-errors'),
                path.join(__dirname, 'node_modules', 'babylon7'),
                path.join(__dirname, 'node_modules', 'eslint', 'lib'),
                path.join(__dirname, 'node_modules', 'eslint-scope'),
                path.join(__dirname, 'node_modules', 'eslint-visitor-keys'),
                path.join(__dirname, 'node_modules', 'eslint6'),
                path.join(__dirname, 'node_modules', 'lodash-es'),
                path.join(__dirname, 'node_modules', 'prettier'),
                path.join(__dirname, 'node_modules', 'react-redux', 'es'),
                path.join(__dirname, 'node_modules', 'recast'),
                path.join(__dirname, 'node_modules', 'redux', 'es'),
                path.join(__dirname, 'node_modules', 'redux-saga', 'es'),
                path.join(__dirname, 'node_modules', 'regexp-tree'),
                path.join(__dirname, 'node_modules', 'simple-html-tokenizer'),
                path.join(__dirname, 'node_modules', 'symbol-observable', 'es'),
                path.join(__dirname, 'node_modules', 'tslib'),
                join(__dirname, 'src'),
                path.join(__dirname, 'node_modules', 'putout'),
                path.join(__dirname, 'node_modules', '@putout/plugin-nodejs'),
                path.join(__dirname, 'node_modules', '@putout'),
                path.join(__dirname, 'node_modules', 'estree-to-babel'),
            ],
            loader: 'babel-loader',
            options: {
                compact: true,
                presets: [
                    [
                        require.resolve('@babel/preset-env'), {
                            modules: 'commonjs',
                        }],
                    require.resolve('@babel/preset-react'),
                ],
                plugins: ['@babel/plugin-transform-optional-chaining', require.resolve('@babel/plugin-transform-runtime')],
            },
        }, {
            test: /\.css$/,
            use: [
                DEV ? 'style-loader' : MiniCssExtractPlugin.loader, {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 1,
                    },
                }, 'postcss-loader',
            ],
        }, {
            test: /\.woff(2)?(\?v=\d\.\d\.\d)?$/,
            use: [{
                loader: 'url-loader',
                
                options: {
                    limit: 10_000,
                    mimetype: 'application/font-woff',
                },
            }],
        }, {
            test: /\.(ttf|eot|svg)(\?v=\d\.\d\.\d)?$/,
            loader: 'file-loader',
        }],
        
        noParse: [
            /acorn\/dist\/acorn\.js/,
            ///acorn\/dist\/acorn\.mjs/,
            /esprima\/dist\/esprima\.js/,
            /esprima-fb\/esprima\.js/,
        ],
    },
    
    plugins,
    resolve: {
        alias: {
            'acorn-private-methods': require.resolve('acorn-private-methods'),
        },
        fallback: {
            'url': require.resolve('url/'),
            'assert': require.resolve('assert'),
            'buffer': require.resolve('buffer/'),
            'path': require.resolve('path-browserify'),
            'child_process': false,
            'fs': false,
            'module': false,
            'net': false,
            'readline': false,
            'os': false,
            'constants': false,
            'jscodeshift': false,
            'process/browser': require.resolve('process/browser'),
            'tty': require.resolve('tty-browserify'),
        },
    },
    
    entry: {
        app: './src/app.js',
    },
    
    output: {
        path: path.resolve(__dirname, '../out-build'),
        filename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
        chunkFilename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
    },
    
    ...DEV && {
        devtool: 'eval-source-map',
    },
};

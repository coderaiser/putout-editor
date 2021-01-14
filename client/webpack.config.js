'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const DEV = process.env.NODE_ENV !== 'production';
const CACHE_BREAKER = Number(fs.readFileSync(path.join(__dirname, 'CACHE_BREAKER')));

const packages = fs.readdirSync(path.join(__dirname, 'packages'));
const test = new RegExp(`/node_modules/(?!${packages.join('|')}/)`);

const plugins = [
    new webpack.DefinePlugin({
        'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    }),
    new webpack.IgnorePlugin(/\.md$/),
    new webpack.IgnorePlugin(/node\/nodeLoader.js/),
    
    // Prettier //
    
    // We don't use these parsers with prettier, so we don't need to include them
    new webpack.IgnorePlugin(/parser-flow/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-postcss/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-typescript/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-vue/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-yaml/, /\/prettier/),
    
    // eslint //
    
    // Shim ESLint stuff that's only relevant for Node.js
    new webpack.NormalModuleReplacementPlugin(
        /(cli-engine|testers\/rule-tester)/,
        'node-libs-browser/mock/empty',
    ),
    
    // More shims
    
    // Doesn't look like jest-validate is useful in our case (prettier uses it)
    new webpack.NormalModuleReplacementPlugin(
        /jest-validate/,
        __dirname + '/src/shims/jest-validate.js',
    ),
    
    // Hack to disable Webpack dynamic requires in ESLint, so we don't end up
    // bundling the entire ESLint directory including files we don't even need.
    // https://github.com/webpack/webpack/issues/198
    new webpack.ContextReplacementPlugin(/eslint/, /NEVER_MATCH^/),
    
    new MiniCssExtractPlugin({
        filename: DEV ? '[name].css' : `[name]-[contenthash]-${CACHE_BREAKER}.css`,
        allChunks: true,
    }),
    
    new HtmlWebpackPlugin({
        favicon: './favicon.png',
        inject: 'body',
        filename: 'index.html',
        template: './index.ejs',
        chunksSortMode: 'id',
    }),
    
    DEV ?
        new webpack.NamedModulesPlugin() :
        new webpack.HashedModuleIdsPlugin(),
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
        rules: [
            {
                test: /\.txt$/,
                exclude: /node_modules/,
                loader: 'raw-loader',
            },
            {
                test: /\.(jsx?|mjs)$/,
                type: 'javascript/auto',
                include: [
                // To transpile our version of acorn as well as the one that
                // espree uses (somewhere in its dependency tree)
                    /\/acorn.es.js$/,
                    /\/acorn.mjs$/,
                    /\/acorn-loose.mjs$/,
                    path.join(__dirname, 'node_modules', 'ast-types'),
                    path.join(__dirname, 'node_modules', 'jsesc'),
                    path.join(__dirname, 'node_modules', 'eslint-visitor-keys'),
                    path.join(__dirname, 'node_modules', 'babel7'),
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
                    path.join(__dirname, 'src'),
                    path.join(__dirname, 'node_modules', 'putout'),
                    path.join(__dirname, 'node_modules', '@putout'),
                ],
                loader: 'babel-loader',
                options: {
                    presets: [
                        [require.resolve('@babel/preset-env'), {
                            modules: 'commonjs',
                        }],
                        require.resolve('@babel/preset-react'),
                    ],
                    plugins: [
                        '@babel/plugin-proposal-optional-chaining',
                        require.resolve('@babel/plugin-transform-runtime'),
                    ],
                },
            },
            {
                test: /\.css$/,
                use: [
                    DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {importLoaders: 1},
                    },
                    'postcss-loader',
                ],
            },
            {
                test: /\.woff(2)?(\?v=\d\.\d\.\d)?$/,
                use: [{
                    loader: 'url-loader',
                    
                    options: {
                        limit: 10_000,
                        mimetype: 'application/font-woff',
                    },
                }],
            },
            {
                test: /\.(ttf|eot|svg)(\?v=\d\.\d\.\d)?$/,
                loader: 'file-loader',
            },
        ],
        
        noParse: [
            /acorn\/dist\/acorn\.js/,
            /acorn\/dist\/acorn\.mjs/,
            /esprima\/dist\/esprima\.js/,
            /esprima-fb\/esprima\.js/,
        ],
    },
    
    node: {
        child_process: 'empty',
        fs: 'empty',
        module: 'empty',
        net: 'empty',
        readline: 'empty',
    },
    
    plugins,
    
    entry: {
        app: './src/app.js',
    },
    
    output: {
        path: path.resolve(__dirname, '../out-build'),
        filename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
        chunkFilename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
    },
    
    ...DEV ? {
        devtool: 'eval',
    } : {},
};

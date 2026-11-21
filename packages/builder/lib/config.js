import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import process from 'node:process';
import {
    createFallback,
    createIgnore,
    createMinimizer,
    createRemoveNodePrefix,
    createReplaceWithNothing,
    createSwcLoader,
} from './shared.js';

const THREE_MB = 3 * 1024 * 1024;

const GROUP = {
    minChunks: 1,
    minSize: 1,
};

const isNamed = (name) => (chunk) => chunk.name === name;

/**
 * `DEV`, `CACHE_BREAKER`, and `VERSION` of a package.
 * The package keeps `CACHE_BREAKER` next to its config.
 * `VERSION` comes from the Docker build argument, else from the root `package.json`.
 */
export const createEnv = (configUrl) => {
    const read = (path) => readFileSync(new URL(path, configUrl), 'utf8');
    
    return {
        DEV: process.env.NODE_ENV !== 'production',
        CACHE_BREAKER: Number(read('CACHE_BREAKER')),
        VERSION: process.env.VERSION || JSON.parse(read('../../package.json')).version,
    };
};

/**
 * The names of the output files: `prefix` is a folder (`chat/`) or an empty string.
 */
export const createFilename = ({DEV, CACHE_BREAKER}, prefix, extension) => {
    if (DEV)
        return `${prefix}[name].${extension}`;
    
    return `${prefix}[name]-[contenthash]-${CACHE_BREAKER}.${extension}`;
};

/**
 * `vendorsChunk` is the name of the entry chunk that gets the vendors.
 * `putoutChunks` is `async` or `all`. `extra` holds the groups of one package.
 * @param {Record<string, any>} options
 */
export const createCacheGroups = ({vendorsChunk, putoutChunks, extra = {}}) => ({
    ...extra,
    codemirror: {
        priority: 25,
        name: 'codemirror',
        test: /\/node_modules\/(@codemirror|@lezer|@replit\/codemirror|@uiw\/codemirror|qword)\//,
        chunks: 'async',
        enforce: true,
        ...GROUP,
    },
    putout: {
        priority: 20,
        name: 'putout',
        test: /\/node_modules\/(putout|@putout)\//,
        chunks: putoutChunks,
        ...GROUP,
    },
    react: {
        priority: 15,
        name: 'react',
        test: /\/node_modules\/(react|react-dom|react-redux|@reduxjs)\//,
        chunks: 'all',
        ...GROUP,
    },
    vendors: {
        priority: 5,
        test: /\/node_modules\//,
        chunks: isNamed(vendorsChunk),
    },
});

export const createChunkNamed = isNamed;

/**
 * Plugins that both packages need. `extra` holds the plugins of one package.
 * @param {Record<string, any>} options
 */
export const createPlugins = ({rspack, HtmlWebpackPlugin, env, prefix, nodeOnly, replaceWithNothing, shim, extra = []}) => {
    const ignore = createIgnore(rspack);
    const replace = createReplaceWithNothing(rspack, shim);
    
    return [
        createRemoveNodePrefix(rspack),
        new rspack.DefinePlugin({
            'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
        }),
        new rspack.ProvidePlugin({
            process: 'process/browser',
        }),
        // `@putout/engine-loader` imports a variable. Cut the context module, keep the package.
        new rspack.ContextReplacementPlugin(/@putout\/engine-loader/, /NEVER_MATCH^/),
        ...nodeOnly.map(ignore),
        ...replaceWithNothing.map(replace),
        new rspack.CssExtractRspackPlugin({
            filename: createFilename(env, prefix, 'css'),
        }),
        // `index.ejs` needs full EJS. `HtmlRspackPlugin` has a subset only.
        new HtmlWebpackPlugin({
            favicon: './favicon.png',
            inject: 'body',
            filename: `${prefix}index.html`,
            template: './index.ejs',
            version: env.VERSION,
        }),
        ...extra,
    ];
};

/**
 * The compiler rule comes after the SWC rule. The `use` array of rspack runs from right to left,
 * and a later matching rule adds its loaders to the end. So the compiler runs first,
 * and SWC reads its output. The compiler reads only `src` of the package.
 * @param {Record<string, any>} options
 */
export const createRules = ({rspack, dev, dir, src, include, postcss = false, extra = []}) => [{
    test: /\.(jsx?|mjs|tsx?)$/,
    type: 'javascript/auto',
    resolve: {
        fullySpecified: false,
    },
    exclude: [
        join(dir, 'node_modules', '@putout/engine-loader'),
    ],
    ...include && {
        include,
    },
    use: [
        createSwcLoader(dev),
    ],
}, {
    test: /\.(jsx?|tsx?)$/,
    include: [src],
    use: [
        '@putout/editor-builder/loader',
    ],
}, {
    test: /\.css$/,
    use: [
        dev ? 'style-loader' : rspack.CssExtractRspackPlugin.loader, {
            loader: 'css-loader',
            options: {
                importLoaders: 1,
            },
        },
        ...postcss ? ['postcss-loader'] : [],
    ],
},
...extra];

/**
 * The config of a package. A package gives its own `rspack`, `HtmlWebpackPlugin`, and `resolve`,
 * so that the builder does not hold a second copy of them.
 * @param {Record<string, any>} options
 */
export const createConfig = ({rspack, HtmlWebpackPlugin, resolve, configUrl, prefix = '', entry, outDir, nodeOnly, replaceWithNothing, cacheGroups, include, postcss, extraRules, extraPlugins, noParse, alias}) => {
    const env = createEnv(configUrl);
    const {DEV} = env;
    const dir = dirname(fileURLToPath(configUrl));
    const src = new URL('src', configUrl).pathname;
    const shim = new URL('./src/shims/empty.js', configUrl).pathname;
    
    return {
        mode: DEV ? 'development' : 'production',
        optimization: {
            moduleIds: 'deterministic',
            runtimeChunk: 'single',
            splitChunks: {
                cacheGroups: createCacheGroups(cacheGroups),
            },
            minimizer: createMinimizer(rspack),
        },
        module: {
            rules: createRules({
                rspack,
                dev: DEV,
                dir,
                src,
                include,
                postcss,
                extra: extraRules,
            }),
            ...noParse && {
                noParse,
            },
        },
        plugins: createPlugins({
            rspack,
            HtmlWebpackPlugin,
            env,
            prefix,
            nodeOnly,
            replaceWithNothing,
            shim,
            extra: extraPlugins,
        }),
        resolve: {
            ...alias && {
                alias,
            },
            extensions: [
                '.ts',
                '.tsx',
                '.js',
                '.jsx',
            ],
            fallback: createFallback(resolve),
        },
        entry,
        output: {
            path: new URL(outDir, configUrl).pathname,
            filename: createFilename(env, prefix, 'js'),
            chunkFilename: createFilename(env, prefix, 'js'),
        },
        ...DEV && {
            devtool: 'eval-source-map',
        },
        performance: {
            maxEntrypointSize: 7 * 1024 * 1024,
            maxAssetSize: THREE_MB,
        },
    };
};

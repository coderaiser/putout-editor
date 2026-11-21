import {
    mkdirSync,
    mkdtempSync,
    writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import process from 'node:process';
import {test} from 'supertape';
import {
    createCacheGroups,
    createChunkNamed,
    createConfig,
    createEnv,
    createFilename,
    createPlugins,
    createRules,
} from '../lib/config.js';

class Plugin {
    args: unknown[];
    constructor(...args: unknown[]) {
        this.args = args;
    }
}

class CssExtractRspackPlugin extends Plugin {
    static loader = 'css-extract-loader';
}

const rspack = {
    IgnorePlugin: class IgnorePlugin extends Plugin {},
    NormalModuleReplacementPlugin: class NormalModuleReplacementPlugin extends Plugin {},
    SwcJsMinimizerRspackPlugin: class SwcJsMinimizerRspackPlugin extends Plugin {},
    DefinePlugin: class DefinePlugin extends Plugin {},
    ProvidePlugin: class ProvidePlugin extends Plugin {},
    ContextReplacementPlugin: class ContextReplacementPlugin extends Plugin {},
    CssExtractRspackPlugin,
};

class HtmlWebpackPlugin extends Plugin {}
const nameOf = (plugin: object) => plugin.constructor.name;

const withEnv = (env: Record<string, string | undefined>, fn: () => unknown) => {
    const before = {
        ...process.env,
    };
    
    for (const [name, value] of Object.entries(env)) {
        if (value)
            process.env[name] = value;
        else
            delete process.env[name];
    }
    
    try {
        return fn();
    } finally {
        process.env = before;
    }
};

const createPackage = (version: string) => {
    const root = mkdtempSync(join(tmpdir(), 'builder-'));
    const dir = join(root, 'packages', 'one');
    
    mkdirSync(dir, {
        recursive: true,
    });
    
    writeFileSync(join(root, 'package.json'), JSON.stringify({
        version,
    }));
    writeFileSync(join(dir, 'CACHE_BREAKER'), '7\n');
    
    return pathToFileURL(join(dir, 'rspack.config.js'));
};

const configUrl = createPackage('3.5.1');

test('builder: config: createEnv: development, version from the root package', (t) => {
    const result = withEnv({
        NODE_ENV: undefined,
        VERSION: undefined,
    }, () => createEnv(configUrl));
    
    const expected = {
        DEV: true,
        CACHE_BREAKER: 7,
        VERSION: '3.5.1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createEnv: production, version from the environment', (t) => {
    const result = withEnv({
        NODE_ENV: 'production',
        VERSION: '9.9.9',
    }, () => createEnv(configUrl));
    
    const expected = {
        DEV: false,
        CACHE_BREAKER: 7,
        VERSION: '9.9.9',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createFilename: development', (t) => {
    const result = createFilename({
        DEV: true,
        CACHE_BREAKER: 7,
    }, 'chat/', 'js');
    
    t.equal(result, 'chat/[name].js');
    t.end();
});

test('builder: config: createFilename: production', (t) => {
    const result = createFilename({
        DEV: false,
        CACHE_BREAKER: 7,
    }, '', 'css');
    
    t.equal(result, '[name]-[contenthash]-7.css');
    t.end();
});

test('builder: config: createChunkNamed', (t) => {
    const isApp = createChunkNamed('app');
    const result = [
        isApp({
            name: 'app',
        }),
        isApp({
            name: 'chat',
        }),
    ];
    const expected = [true, false];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createCacheGroups: names of the groups', (t) => {
    const result = Object
        .keys(createCacheGroups({
            vendorsChunk: 'app',
            putoutChunks: 'all',
            extra: {
                babel: {},
            },
        }))
        .sort();
    
    const expected = [
        'babel',
        'codemirror',
        'putout',
        'react',
        'vendors',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createCacheGroups: putout chunks and vendors chunk', (t) => {
    const {putout, vendors} = createCacheGroups({
        vendorsChunk: 'chat',
        putoutChunks: 'async',
    });
    
    const result = [putout.chunks, vendors.chunks({
        name: 'chat',
    }), vendors.chunks({
        name: 'app',
    })];
    const expected = ['async', true, false];
    
    t.deepEqual(result, expected);
    t.end();
});

const createPluginsOf = (extra?: unknown[]) => createPlugins({
    rspack,
    HtmlWebpackPlugin,
    env: {
        DEV: false,
        CACHE_BREAKER: 7,
        VERSION: '3.5.1',
    },
    prefix: 'chat/',
    nodeOnly: [/globby/],
    replaceWithNothing: ['@putout/processor-css'],
    shim: '/shim.js',
    extra,
});

test('builder: config: createPlugins: names', (t) => {
    const result = createPluginsOf().map(nameOf);
    const expected = [
        'NormalModuleReplacementPlugin',
        'DefinePlugin',
        'ProvidePlugin',
        'ContextReplacementPlugin',
        'IgnorePlugin',
        'NormalModuleReplacementPlugin',
        'CssExtractRspackPlugin',
        'HtmlWebpackPlugin',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createPlugins: html and css use the prefix', (t) => {
    const plugins = createPluginsOf() as Plugin[];
    const css = plugins.find((plugin) => nameOf(plugin) === 'CssExtractRspackPlugin');
    const html = plugins.find((plugin) => nameOf(plugin) === 'HtmlWebpackPlugin');
    
    const result = [css && css.args, html && html.args];
    const expected = [
        [{
            filename: 'chat/[name]-[contenthash]-7.css',
        }],
        [{
            favicon: './favicon.png',
            inject: 'body',
            filename: 'chat/index.html',
            template: './index.ejs',
            version: '3.5.1',
        }],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createPlugins: the extra plugins come last', (t) => {
    const extra = new Plugin('extra');
    const plugins = createPluginsOf([extra]);
    const result = plugins.at(-1);
    
    t.equal(result, extra);
    t.end();
});

test('builder: config: createPlugins: API_HOST', (t) => {
    const plugins = withEnv({
        API_HOST: 'http://localhost',
    }, () => createPluginsOf()) as Plugin[];
    
    const [{args}] = plugins.filter((plugin) => nameOf(plugin) === 'DefinePlugin');
    
    const expected = [{
        'process.env.API_HOST': '"http://localhost"',
    }];
    
    t.deepEqual(args, expected);
    t.end();
});

const createRulesOf = (options = {}) => createRules({
    rspack,
    dev: false,
    dir: '/pkg',
    src: '/pkg/src',
    ...options,
}) as Record<string, unknown>[];

test('builder: config: createRules: the compiler rule comes after the SWC rule', (t) => {
    const [swc, compiler] = createRulesOf();
    
    const result = [
        JSON
            .stringify(swc.use)
            .includes('builtin:swc-loader'),
        compiler.use,
        compiler.include,
    ];
    
    const expected = [
        true,
        ['@putout/editor-builder/loader'],
        ['/pkg/src'],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createRules: the SWC rule skips the engine loader', (t) => {
    const [{exclude}] = createRulesOf();
    const result = exclude;
    const expected = ['/pkg/node_modules/@putout/engine-loader'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createRules: include of the SWC rule', (t) => {
    const [withInclude] = createRulesOf({
        include: ['/pkg/src', '/pkg/node_modules/tslib'],
    });
    
    const [without] = createRulesOf();
    
    const result = [withInclude.include, 'include' in without];
    const expected = [['/pkg/src', '/pkg/node_modules/tslib'], false];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createRules: css in production uses the extract loader', (t) => {
    const [, , {use}] = createRulesOf() as unknown as [unknown, unknown, {
        use: unknown[];
    }];
    const [first] = use;
    
    t.equal(first, 'css-extract-loader');
    t.end();
});

test('builder: config: createRules: css in development uses style-loader and postcss', (t) => {
    const [, , {use}] = createRulesOf({
        dev: true,
        postcss: true,
    }) as unknown as [unknown, unknown, {
        use: unknown[];
    }];
    
    const result = [use[0], use.at(-1)];
    const expected = [
        'style-loader',
        'postcss-loader',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createRules: extra rules come last', (t) => {
    const extra = {
        test: /\.woff$/,
    };
    
    const rules = createRulesOf({
        extra: [extra],
    });
    
    const result = rules.at(-1);
    const expected = extra;
    
    t.equal(result, expected);
    t.end();
});

const createConfigOf = (env: Record<string, string | undefined>, options = {}) => withEnv(env, () => createConfig({
    rspack,
    HtmlWebpackPlugin,
    resolve: (name: string) => `/resolved/${name}`,
    configUrl,
    entry: {
        app: './src/app.tsx',
    },
    outDir: '../../out-build',
    nodeOnly: [],
    replaceWithNothing: [],
    cacheGroups: {
        vendorsChunk: 'app',
        putoutChunks: 'all',
    },
    ...options,
})) as Record<string, any>;

test('builder: config: createConfig: development', (t) => {
    const {mode, devtool} = createConfigOf({
        NODE_ENV: undefined,
    });
    
    const result = [mode, devtool];
    const expected = [
        'development',
        'eval-source-map',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createConfig: production', (t) => {
    const config = createConfigOf({
        NODE_ENV: 'production',
    });
    
    const result = [config.mode, 'devtool' in config, config.output.filename];
    const expected = [
        'production',
        false,
        '[name]-[contenthash]-7.js',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createConfig: output path is relative to the config', (t) => {
    const {output} = createConfigOf({
        NODE_ENV: 'production',
    });
    
    const result = output.path.endsWith('/out-build');
    
    t.ok(result);
    t.end();
});

test('builder: config: createConfig: optional parts are absent', (t) => {
    const {
        module: {
            noParse,
        },
        resolve,
    } = createConfigOf({
        NODE_ENV: 'production',
    });
    
    const result = [noParse, 'alias' in resolve];
    const expected = [undefined, false];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createConfig: optional parts are present', (t) => {
    const {
        module: {
            noParse,
        },
        resolve,
    } = createConfigOf({
        NODE_ENV: 'production',
    }, {
        noParse: [/acorn/],
        alias: {
            '#store': '/store.ts',
        },
    });
    
    const result = [noParse, resolve.alias];
    
    const expected = [
        [/acorn/], {
            '#store': '/store.ts',
        },
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: config: createConfig: fallback comes from the package resolve', (t) => {
    const {resolve} = createConfigOf({
        NODE_ENV: 'production',
    });
    
    t.equal(resolve.fallback.url, '/resolved/url/');
    t.end();
});

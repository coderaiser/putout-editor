/**
 * Parts of the rspack config that `packages/client` and `packages/chat` share.
 * This file imports nothing: each config gives its own `rspack` and `resolve`.
 */
export const NODE_ONLY = [
    /globby/,
    /import-meta-resolve/,
    /unicorn-magic/,
    /stylelint/,
    /supports-hyperlinks/,
    /hermes-parser/,
];

export const createIgnore = (rspack) => (resourceRegExp) => new rspack.IgnorePlugin({
    resourceRegExp,
});

export const createReplaceWithNothing = (rspack, shim) => (name) => {
    const request = RegExp(`^${name.replace('/', '\\/')}$`);
    return new rspack.NormalModuleReplacementPlugin(request, shim);
};

export const createRemoveNodePrefix = (rspack) => new rspack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
    resource.request = resource.request.replace(/^node:/, '');
});

export const createMinimizer = (rspack) => [
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
];

export const createSwcLoader = (dev) => ({
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
                    development: dev,
                },
            },
            externalHelpers: true,
        },
        env: {
            targets: 'last 2 Chrome versions, last 2 Safari versions, Firefox ESR, not dead',
        },
    },
});

/**
 * Node built-ins for a browser bundle. `false` means: the bundle has no module.
 * Nothing on the page calls these modules.
 */
export const createFallback = (resolve) => ({
    'url': resolve('url/'),
    'assert': resolve('assert'),
    'buffer': resolve('buffer/'),
    'events': resolve('events/'),
    'path': resolve('path-browserify'),
    'tty': resolve('tty-browserify'),
    'process/browser': resolve('process/browser'),
    'process': resolve('process/browser'),
    'util': resolve('util'),
    'async_hooks': false,
    'child_process': false,
    'constants': false,
    'crypto': false,
    'fs': false,
    'inspector': false,
    'jscodeshift': false,
    'module': false,
    'net': false,
    'os': false,
    'perf_hooks': false,
    'readline': false,
    'stream': false,
    'v8': false,
    'worker_threads': false,
    'zlib': false,
});

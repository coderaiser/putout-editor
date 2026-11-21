import {createRequire} from 'node:module';
import {rspack} from '@rspack/core';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {createConfig} from '@putout/editor-builder/config';
import {NODE_ONLY} from '@putout/editor-builder/shared';

const {resolve} = createRequire(import.meta.url);

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

export default createConfig({
    rspack,
    HtmlWebpackPlugin,
    resolve,
    configUrl: import.meta.url,
    // `chat/index.html`: `/chat` and `/chat/` both serve the page.
    prefix: 'chat/',
    entry: {
        chat: './src/index.tsx',
    },
    // `out` is shared with the client. Chat adds `chat/` and deletes nothing.
    outDir: '../../out',
    nodeOnly: CHAT_NODE_ONLY,
    replaceWithNothing: REPLACED_WITH_NOTHING,
    cacheGroups: {
        vendorsChunk: 'chat',
        // 🐊Putout calls `os.homedir()` on load. Load it only when a command needs it.
        putoutChunks: 'async',
    },
    alias: {
        '#store': new URL('./src/store/index.ts', import.meta.url).pathname,
        '#test/store': new URL('./test/store.ts', import.meta.url).pathname,
    },
});

import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {run} from 'madrun';
import {defineEnv} from 'supertape/env';

const here = dirname(fileURLToPath(import.meta.url));

const {NODE_OPTIONS} = defineEnv({
    ts: true,
});

const startEnv = {
    STATIC: 'out',
    NODE_OPTIONS,
};

const devEnv = {
    PORT: 3000,
    STATIC: 'out',
    NODE_OPTIONS,
};

/**
 * Client first, chat second, **sequentially**.
 *
 * The client's build is `rspack build && rimraf ../../out && mv ../../out-build
 * ../../out` — it stages into `out-build` and then replaces `out/` wholesale.
 * Chat writes `out/chat.html` and `out/chat/` beside the editor's files and
 * deletes nothing, so the order is the whole contract: chat first and the
 * client's `rimraf` takes `chat.html` with it; the two in parallel and it is a
 * race on the same directory.
 *
 * `madfork build` cannot express that — it fans out to packages without an order
 * — so the two are named. `packages/server` has no `build`, so nothing else is
 * lost by not fanning out.
 *
 * **Both paths are absolute**, and that is not a style choice: the two commands
 * are chained with `&&` in one shell, so a relative `cd packages/chat` after
 * `cd packages/client` resolves from *inside* the client — `can't cd to
 * packages/chat`, and the root build failed at the second step while looking
 * like the first had worked. `__dirname` is this file's directory, so the paths
 * are correct regardless of the shell's working directory.
 */
const build = [
    `cd ${join(here, 'packages/client')} && bun run build`,
    `cd ${join(here, 'packages/chat')} && bun run build`,
].join(' && ');

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'build': () => build,
    'start': () => [startEnv, 'node bin/putout-editor.js'],
    'start:dev': () => [devEnv, 'node bin/putout-editor.js'],
    'test': () => 'madfork test',
    'test:one': () => 'madfork test:one',
    'test:e2e': () => 'madfork test:e2e',
    'coverage': async () => 'madfork coverage',
    'coverage:json': () => 'madfork coverage:json',
    'prelint': () => 'putout bin .github deploy',
    'lint': () => [
        'node scripts/gen-diagrams.mjs --check',
        'madfork lint',
    ],
    'test:dts': () => 'madfork test:dts',
    'prefix:lint': () => run('prelint', '--fix'),
    'fix:lint': () => 'madfork fix:lint',
    'report': () => 'cd packages/client && c8 report --reporter=lcov',
    'gen:diagrams': () => 'node scripts/gen-diagrams.mjs',
};

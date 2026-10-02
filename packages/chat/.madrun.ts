import process from 'node:process';
import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const testEnv = defineEnv({
    css: true,
    dom: true,
    ts: true,
    jsx: true,
});

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'test': () => [
        testEnv,
        'tape "src/**/*.spec.{ts,tsx}" "test/**/*.spec.ts"',
    ],
    'test:one': () => [
        testEnv,
        `tape ${process.env.SPEC || '"src/**/*.spec.{ts,tsx}"'}`,
    ],
    'coverage': async () => [testEnv, `c8 ${await cutEnv('test')}`],
    'coverage:json': async () => [testEnv, `c8 --reporter json ${await cutEnv('test')}`],
    'test:dts': () => 'tsc --noEmit',
    'test:e2e': () => 'playwright test',
    'lint': () => 'putout .',
    'fix:lint': () => 'putout . --fix',
    // `out` is shared with the client, and the client's build deletes it. So this
    
    // one writes into `out` directly and the client keeps its own `out-build`
    
    // staging: two packages, one directory, no `rimraf` race.
    'build': () => build('production'),
    'build:dev': () => build('development'),
    // Serves the prebuilt bundle, same as the client. A change under `src/` is
    
    // invisible here until `bun run build`.
    'start': () => 'http-server ../../out',
};

/**
 * Unlike the client, this does not `rimraf ../../out` and swap a staged
 * directory in: `out` is shared, and the client's own build deletes it. Chat
 * writes `out/chat/` next to the editor's files, so the two builds are
 * order-independent.
 */
function build(env: string) {
    return `NODE_ENV=${env} rspack build --mode=${env}`;
}

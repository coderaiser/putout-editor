import process from 'node:process';
import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

/**
 * `ts` and `jsx` even though nothing under `lib/` is a component: the specs
 * reach the parser through `@putout/editor-commands`, which this package
 * depends on, and a spec that imports a babel AST wants the loader either way.
 * `dom` is not here — nothing in this package renders, which is the whole point
 * of the split from `chat`.
 */
const testEnv = defineEnv({
    ts: true,
    jsx: true,
});

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'test': () => [testEnv, 'tape "test/**/*.spec.ts"'],
    'test:one': () => [
        testEnv,
        `tape ${process.env.SPEC || '"test/**/*.spec.ts"'}`,
    ],
    'coverage': async () => [testEnv, `c8 ${await cutEnv('test')}`],
    'coverage:json': async () => [testEnv, `c8 --reporter json ${await cutEnv('test')}`],
    'test:dts': () => 'tsc --noEmit',
    'lint': () => 'putout .',
    'fix:lint': () => 'putout . --fix',
};

import process from 'node:process';
import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

/**
 * `dom` and `jsx` stay enabled even though nothing in `src/` is a component any
 * more: the AST tree moved to `packages/chat/src/components/`, and the reason
 * this package keeps the loaders is that a *spec* may still want to import a
 * component by path. Nothing in the barrel re-exports one — `index.spec.ts`
 * asserts that — so a Node consumer of this package cannot pull React in, which
 * is the property that matters and the reason the tree moved here at all.
 */
const testEnv = defineEnv({
    dom: true,
    ts: true,
    jsx: true,
});

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'test': () => [testEnv, 'tape "src/**/*.spec.{ts,tsx}"'],
    'test:one': () => [
        testEnv,
        `tape ${process.env.SPEC || '"src/**/*.spec.{ts,tsx}"'}`,
    ],
    'coverage': async () => [testEnv, `c8 ${await cutEnv('test')}`],
    'coverage:json': async () => [testEnv, `c8 --reporter json ${await cutEnv('test')}`],
    'test:dts': () => 'tsc --noEmit',
    'lint': () => 'putout .',
    'fix:lint': () => 'putout . --fix',
};

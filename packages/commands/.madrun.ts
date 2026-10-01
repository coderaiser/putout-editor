import process from 'node:process';
import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

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

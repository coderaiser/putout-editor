import process from 'node:process';
import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const testEnv = defineEnv({
    ts: true,
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

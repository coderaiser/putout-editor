import process from 'node:process';
import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const {NODE_OPTIONS} = defineEnv({
    ts: true,
});

const testEnv = {
    NODE_OPTIONS,
};

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'build': () => 'bun build src/index.ts --outdir dist --target node > /dev/null',
    'start': () => 'node dist/index.js',
    'start:ts': () => [testEnv, 'bun src/index.ts'],
    'test': () => [testEnv, 'tape "src/**/*.spec.ts"'],
    'test:one': () => [
        testEnv,
        `tape ${process.env.SPEC || '"src/**/*.spec.ts"'}`,
    ],
    'coverage': async () => [testEnv, `c8 ${await cutEnv('test')}`],
    'coverage:json': async () => [testEnv, `c8 --reporter json ${await cutEnv('test')}`],
    'prelint': () => 'redlint fix',
    'lint': () => 'putout .',
    'fix:lint': () => 'putout . --fix',
    'test:dts': () => 'tsc --noEmit',
};

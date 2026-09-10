import {cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const {NODE_OPTIONS} = defineEnv({
    ts: true,
});

const testEnv = {
    NODE_OPTIONS,
};

export default {
    'build':    () => 'bun build src/index.ts --outdir dist --target node',
    'start':    () => 'node dist/index.js',
    'start:ts': () => [testEnv, 'bun src/index.ts'],
    'test':     () => [testEnv, 'tape \"src/**/*.spec.ts\"'],
    'coverage': async () => [testEnv, `c8 ${await cutEnv('test')}`],
    'prelint':  () => 'redlint fix',
    'lint':     () => 'putout .',
    'fix:lint': () => 'putout . --fix',
    'test:dts': () => 'tsc --noEmit',
};

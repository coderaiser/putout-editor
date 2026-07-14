import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const testEnv = defineEnv({
    nestjs: true,
});

const {NODE_OPTIONS} = defineEnv({
    ts: true,
});

const startEnv = {
    STATIC: '../out',
    NODE_OPTIONS,
};

const allEnv = {
    AUTH_TOKEN: 'test-token',
    ...testEnv,
};

export default {
    'build': () => 'nest build',
    'start': () => [startEnv, 'node dist/main.js'],
    'start:bun': () => [startEnv, 'bun dist/main.js'],
    'start:ts': () => [
        startEnv,
        'node --import @supertape/loader-nestjs src/main.ts',
    ],
    'test': () => [allEnv, 'tape "src/**/*.spec.ts"'],
    'test:js': () => [allEnv, 'tape "dist/**/*.spec.js"'],
    'coverage': async () => [allEnv, `c8 ${await cutEnv('test')}`],
    'prelint': () => 'redlint scan',
    'lint': () => 'putout .',
    'test:dts': () => 'tsc --noEmit',
    'prefix:lint': () => 'redlint fix',
    'fix:lint': () => run('lint', '--fix'),
};

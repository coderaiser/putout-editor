import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const env = defineEnv({
    ts: true,
});

const allEnv = {
    ...env,
    AUTH_TOKEN: 'test-token',
};

export default {
    'build': () => 'nest build',
    'start': () => 'STATIC=../out node dist/main.js',
    'start:bun': () => 'STATIC=../out bun dist/main.js',
    'test': () => [allEnv, 'tape "src/**/*.spec.ts"'],
    'coverage': async () => [allEnv, `c8 ${await cutEnv('test')}`],
    'lint': () => 'putout .',
    'types': () => 'tsc --noEmit',
    'fix:lint': () => run('lint', '--fix'),
};

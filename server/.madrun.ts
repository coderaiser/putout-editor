import {run} from 'madrun';
import {defineEnv} from 'supertape/env';

const env = defineEnv({
    ts: true,
});

export default {
    'build': () => 'nest build',
    'start': () => 'STATIC=../out node dist/main.js',
    'test': () => [env, 'tape "src/**/*.spec.ts"'],
    'coverage': async () => [env, `c8 ${await run('test')}`],
    'lint': () => 'putout .',
    'fix:lint': () => run('lint', '--fix'),
};


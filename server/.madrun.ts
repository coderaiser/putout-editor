import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const startEnv = {
    STATIC: '../out',
}

const env = defineEnv({
    ts: true,
});

const allEnv = {
    ...env,
    AUTH_TOKEN: 'test-token',
};

export default {
    'build': () => 'nest build',
    'start': () => [startEnv, 'node dist/main.js'],
    'start:bun': () => [startEnv, 'bun dist/main.js'],
    'start:ts': () => [startEnv, 'node --import @supertape/loader-ts src/main.ts'],
    'test': () => [allEnv, 'tape "src/**/*.spec.ts"'],
    'coverage': async () => [allEnv, `c8 ${await cutEnv('test')}`],
    'lint': () => 'putout .',
    'types': () => 'tsc --noEmit',
    'fix:lint': () => run('lint', '--fix'),
};

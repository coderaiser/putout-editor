import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const testEnv = defineEnv({
    nestjs: true,
});

const {NODE_OPTIONS} = defineEnv({
    ts: true,
});

const startEnv = {
    STATIC: 'out',
    NODE_OPTIONS,
};

const allEnv = {
    AUTH_TOKEN: 'test-token',
    ...testEnv,
};

export default {
    'build': () => 'madfork build',
    'test': () => 'madfork test',
    'start': () => [startEnv, 'node bin/putout-editor.js'],
    'test': () => 'madfork test',
    'coverage': async () => 'madfork coverage',
    'lint': () => 'madfork lint',
    'test:dts': () => 'madfork test:dts',
    'fix:lint': () => run('lint', '--fix'),
};


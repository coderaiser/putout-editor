import {run} from 'madrun';
import {defineEnv} from 'supertape/env';

const {NODE_OPTIONS} = defineEnv({
    ts: true,
});

const startEnv = {
    STATIC: 'out',
    NODE_OPTIONS,
};

const devEnv = {
    PORT: 3000,
    STATIC: 'out',
    NODE_OPTIONS,
};

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'build': () => 'madfork build',
    'start': () => [startEnv, 'node bin/putout-editor.js'],
    'start:dev': () => [devEnv, 'node bin/putout-editor.js'],
    'test': () => 'madfork test',
    'test:one': () => 'madfork test:one',
    'test:e2e': () => 'madfork test:e2e',
    'coverage': async () => 'madfork coverage',
    'coverage:json': () => 'madfork coverage:json',
    'prelint': () => 'putout bin .github deploy',
    'lint': () => [
        'node scripts/gen-diagrams.mjs --check',
        'madfork lint',
    ],
    'test:dts': () => 'madfork test:dts',
    'prefix:lint': () => run('prelint', '--fix'),
    'fix:lint': () => 'madfork fix:lint',
    'report': () => 'cd packages/client && c8 report --reporter=lcov',
    'gen:diagrams': () => 'node scripts/gen-diagrams.mjs',
};

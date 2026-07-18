import {run} from 'madrun';
import {defineEnv} from 'supertape/env';

const {NODE_OPTIONS} = defineEnv({
    ts: true,
});

const startEnv = {
    STATIC: 'out',
    NODE_OPTIONS,
};

export default {
    'build': () => 'madfork build',
    
    'start': () => [startEnv, 'node bin/putout-editor.js'],
    'test': () => 'madfork test',
    'coverage': async () => 'madfork coverage',
    'prelint': () => 'putout bin .github deploy',
    'lint': () => 'madfork lint',
    'test:dts': () => 'madfork test:dts',
    'prefix:lint': () => run('prelint', '--fix'),
    'fix:lint': () => 'madfork fix:lint',
};

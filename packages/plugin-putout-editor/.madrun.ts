import {run} from 'madrun';

export default {
    'test': () => 'supertape "test/**/*.spec.js"',
    'coverage': async () => `c8 ${await run('test')}`,
    'test:dts': () => 'node --check lib/index.js',
    'lint': () => 'putout .',
    'fix:lint': () => 'putout . --fix',
};

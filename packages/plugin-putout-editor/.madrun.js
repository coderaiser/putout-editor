import process from 'node:process';
import {run} from 'madrun';

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'test': () => `tape 'test/*.js' 'lib/**/*.spec.js'`,
    'test:one': () => `tape ${process.env.SPEC || `'test/*.js' 'lib/**/*.spec.js'`}`,
    'test:dts': async () => 'echo "no types"',
    'watch:test': async () => `nodemon -w lib -w test -x "${await run('test')}"`,
    'build': async () => `node -e "import('./lib/index.js').then(({rules}) => console.log(Object.keys(rules).join(' ')))"`,
    'lint': () => 'putout .',
    'fix:lint': () => 'putout . --fix',
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'coverage': async () => `c8 ${await run('test')}`,
    'coverage:json': async () => `c8 --reporter json ${await run('test')}`,
    'report': () => 'c8 report --reporter=lcov',
};

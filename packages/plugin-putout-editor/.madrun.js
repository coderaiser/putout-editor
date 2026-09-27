import {run} from 'madrun';

export default {
    'test': () => `tape 'test/*.js'`,
    'test:dts': async () => 'echo "no types"',
    'watch:test': async () => `nodemon -w lib -w test -x "${await run('test')}"`,
    'build': async () => `node -e "import('./lib/index.js').then(({rules}) => console.log(Object.keys(rules).join(' ')))"`,
    'lint': () => `node scripts/check-comments.js && putout .`,
    'fix:lint': () => `node scripts/check-comments.js && putout . --fix`,
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'coverage': async () => `c8 ${await run('test')}`,
    'report': () => 'c8 report --reporter=lcov',
};

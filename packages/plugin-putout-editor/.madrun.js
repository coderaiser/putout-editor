import {run} from 'madrun';

export default {
    'test': () => `tape 'test/*.js'`,
    'watch:test': async () => `nodemon -w lib -w test -x "${await run('test')}"`,
    'lint': () => `node scripts/check-comments.js && putout .`,
    'fix:lint': () => `node scripts/check-comments.js && putout . --fix`,
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'coverage': async () => `c8 ${await run('test')}`,
    'report': () => 'c8 report --reporter=lcov',
};

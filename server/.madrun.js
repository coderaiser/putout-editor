import {run} from 'madrun';

export default {
    'build': () => 'nest build',
    'start': () => 'STATIC=../out node dist/main.js',
    'test': () => 'tape test/app.test.js',
    'lint': () => 'putout .',
    'fix:lint': () => run('lint', '--fix'),
};

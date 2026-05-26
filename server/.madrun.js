import {run} from 'madrun';

export default {
    'start': () => 'STATIC=../out node index.js',
    'lint': () => 'putout .',
    'fix:lint': () => run('lint', '--fix'),
};

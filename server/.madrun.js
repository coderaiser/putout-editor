'use strict';

const {run} = require('madrun');

module.exports = {
    'start': () => 'STATIC=../out node index.js',
    'lint': () => 'putout .',
    'fix:lint': () => run('lint', '--fix'),
};

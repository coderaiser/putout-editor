'use strict';

const {run} = require('madrun');

module.exports = {
    'start': () => 'STATIC=../out node index.js',
    'lint': () => 'putout handlers *.js .madrun.js',
    'fix:lint': () => run('lint', '--fix'),
};


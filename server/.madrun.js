'use strict';

const {
    run,
    series,
    parallel,
} = require('madrun');

module.exports = {
    "start": () => 'STATIC=../out node index.js',
    "lint": () => 'putout handlers lib constants',
    "fix:lint": () => run('lint', '--fix'),
};


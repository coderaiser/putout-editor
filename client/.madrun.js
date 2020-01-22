'use strict';

const {run} = require('madrun');

module.exports = {
    'start': () => 'http-server ../out',
    'build': () => build('production'),
    'build:dev': () => build('development'),
    'watch': () => 'webpack -dw --mode=development',
    'fix:eslint': () => 'eslint --fix src',
    'lint': () => 'putout src *.js .*.js .madrun.js',
    'fix:lint': () => run('lint', '--fix'),
    'fontcustom': () => 'fontcustom compile ./fontcustom/input-svg/ --config=./fontcustom/config.yml',
    'eslint:hotfix': () => 'rm -rf node_modules/eslint/node_modules/acorn',
    'halting-problem:hotfix': () => 'rm -rf node_modules/halting-problem/node_modules/acorn',
    'init': () => {
        const rmPutout = 'rm -rf node_modules/putout';
        const lnPutout = 'ln -s ~/putout/packages/putout node_modules/putout';
        
        const cmd = [
            run('*:hotfix'),
            rmPutout,
            lnPutout,
        ].join(' && ');
        
        return cmd;
    },
};

function build(env) {
    const rm = 'rimraf ../out';
    const mv = 'mv ../out-build ../out';
    const webpack = `NODE_ENV=${env} webpack --mode=${env}`;
    
    return `${webpack} && ${rm} && ${mv}`;
}


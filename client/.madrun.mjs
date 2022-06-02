import {run} from 'madrun';

const env = {
    NODE_OPTIONS: '--max_old_space_size=2048',
};

export default {
    'start': () => 'http-server ../out',
    'build': () => [env, build('production')],
    'build:dev': () => [env, build('development')],
    'watch': () => [env, 'webpack -w --mode=development -o ../out'],
    'fix:eslint': () => 'eslint --fix src',
    'lint': () => 'putout .',
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'fix:lint': () => run('lint', '--fix'),
    'fontcustom': () => 'fontcustom compile ./fontcustom/input-svg/ --config=./fontcustom/config.yml',
    'eslint:hotfix': () => 'rm -rf node_modules/eslint/node_modules/acorn',
    'halting-problem:hotfix': () => 'rm -rf node_modules/halting-problem/node_modules/acorn',
    
    'init': async () => {
        const rmPutout = 'rm -rf node_modules/putout';
        const lnPutout = 'ln -s ~/putout/packages/putout node_modules/putout';
        
        const cmd = [
            await run('*:hotfix'),
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


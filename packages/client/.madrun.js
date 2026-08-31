import {run} from 'madrun';
import {defineEnv} from 'supertape/env';

const testEnv = defineEnv({
    jsx: true,
    dom: true,
    css: true,
}, {
    env: {
        NODE_OPTIONS: '--enable-source-maps --import ./loader-ts.js',
    },
});

const env = {
    NODE_OPTIONS: '--max_old_space_size=5048',
};

export default {
    'test': () => [testEnv, 'tape "src/**/*.spec.{js,ts,tsx}"'],
    'coverage': async () => [testEnv, `c8 tape "src/**/*.spec.{js,ts,tsx}"`],
    'test:dts': () => 'tsc --noEmit',
    'start': () => 'http-server ../../out',
    'build': () => [env, build('production')],
    'build:dev': () => [env, build('development')],
    'watch': () => [
        env,
        'rspack build -w --mode=development -o ../../out',
    ],
    'fix:eslint': () => 'eslint --fix src',
    'prelint': () => 'redlint fix',
    'lint': () => 'putout .',
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'prefix:lint': () => 'redlint fix',
    'fix:lint': () => 'putout . --fix',
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
    const rm = 'rimraf ../../out';
    const mv = 'mv ../../out-build ../../out';
    const rspack = `NODE_ENV=${env} rspack build --mode=${env}`;
    
    return `${rspack} && ${rm} && ${mv}`;
}

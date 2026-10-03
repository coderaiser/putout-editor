import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const testEnv = defineEnv({
    dom: true,
    css: true,
    ts: true,
    jsx: true,
});

const env = {
    NODE_OPTIONS: '--max_old_space_size=5048',
};

const bin = 'export PATH="$PWD/../../node_modules/.bin:$PATH"';

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'test': () => [
        testEnv,
        'tape "src/**/*.spec.{ts,tsx}" "test/**/*.spec.ts" "config/**/*.spec.ts"',
    ],
    'test:one': () => [
        testEnv,
        `tape ${process.env.SPEC || '"src/**/*.spec.{ts,tsx}"'}`,
    ],
    'test:fail': () => [
        testEnv,
        `supertape -f fail ${process.env.SPEC || '"src/**/*.spec.{ts,tsx}"'}`,
    ],
    'test:json': () => [
        testEnv,
        `supertape -f json-lines ${process.env.SPEC || '"**/*.spec.{ts,tsx}"'}`,
    ],
    'test:e2e': () => 'playwright test',
    'test:e2e:desktop': () => 'playwright test --project=desktop-chrome',
    'e2e': () => 'playwright test',
    'coverage': async () => [testEnv, `c8 ${await cutEnv('test')}`],
    'coverage:json': async () => [testEnv, `c8 --reporter json ${await cutEnv('test')}`],
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
    // redlint first: it is the only thing that runs the filesystem ruleset, which is
    
    // where the css architecture lives (see docs/architecture.md)
    'fix:lint': () => 'redlint fix && putout . --fix',
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

function build(env: string) {
    const rm = 'rimraf ../../out';
    const mv = 'mv ../../out-build ../../out';
    const rspack = `NODE_ENV=${env} rspack build --mode=${env}`;
    
    return `${bin} && ${rspack} && ${rm} && ${mv}`;
}

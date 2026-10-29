import process from 'node:process';
import {run, cutEnv} from 'madrun';
import {defineEnv} from 'supertape/env';

const testEnv = defineEnv({
    css: true,
    dom: true,
    ts: true,
    jsx: true,
});

export default {
    'check': async () => `putout . && ${await run(['test:dts', 'coverage'])}`,
    'test': () => [
        testEnv,
        'tape "src/**/*.spec.{ts,tsx}" "test/**/*.spec.ts"',
    ],
    'test:one': () => [
        testEnv,
        `tape ${process.env.SPEC || '"src/**/*.spec.{ts,tsx}"'}`,
    ],
    'coverage': async () => [testEnv, `c8 ${await cutEnv('test')}`],
    'coverage:json': async () => [testEnv, `c8 --reporter json ${await cutEnv('test')}`],
    'test:dts': () => 'tsc --noEmit',
    'test:e2e': () => 'playwright test',
    'lint': () => 'putout .',
    'fix:lint': () => 'putout . --fix',
    'build': () => build('production'),
    'build:dev': () => build('development'),
    'start': () => 'http-server ../../out',
};

function build(env: string) {
    return `NODE_ENV=${env} rspack build --mode=${env}`;
}

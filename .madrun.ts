import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {run} from 'madrun';
import {defineEnv} from 'supertape/env';

const here = dirname(fileURLToPath(import.meta.url));

const {NODE_OPTIONS} = defineEnv({
    ts: true,
});

const startEnv = {
    STATIC: 'out',
    NODE_OPTIONS,
};

const devEnv = {
    PORT: 3000,
    STATIC: 'out',
    NODE_OPTIONS,
};

const build = [
    'packages/client',
    'packages/chat',
    'packages/server',
    'packages/mcp',
].map(buildIn).join(' && ');

export default {
    'check': async () => `${await run('lint:deps')} && putout . && ${await run(['test:dts', 'coverage'])}`,
    'build': () => build,
    'start': () => [startEnv, 'node bin/putout-editor.js'],
    'start:dev': () => [devEnv, 'node bin/putout-editor.js'],
    'test': () => 'madfork test',
    'test:one': () => 'madfork test:one',
    'test:e2e': () => 'madfork test:e2e',
    'coverage': async () => 'madfork coverage',
    'coverage:json': () => 'madfork coverage:json',
    'prelint': () => 'putout bin .github deploy',
    'lint': () => 'node scripts/gen-diagrams.mjs --check && madfork lint',
    'lint:deps': () => 'knip --include unlisted',
    'test:dts': () => 'madfork test:dts',
    'prefix:lint': () => run('prelint', '--fix'),
    'fix:lint': async () => `${await run('lint:deps')} && madfork fix:lint`,
    'report': () => 'cd packages/client && c8 report --reporter=lcov',
    'gen:diagrams': () => 'node scripts/gen-diagrams.mjs',
};

function buildIn(dir: string) {
    return `cd ${join(here, dir)} && bun run build`;
}

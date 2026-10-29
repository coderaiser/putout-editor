import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {test} from 'supertape';
import {createServer} from './server.ts';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const README = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

type Holder = {
    _registeredTools: Record<string, unknown>;
};

const readConfig = () => JSON.parse(readFileSync(join(ROOT, '.mcp.json'), 'utf8'));

test('setup: .mcp.json names the server putout', (t) => {
    const result = Object.keys(readConfig().mcpServers);
    const expected = ['putout'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('setup: .mcp.json starts the server with bun', (t) => {
    const {command} = readConfig().mcpServers.putout;
    
    t.equal(command, 'bun');
    t.end();
});

test('setup: .mcp.json points at a script that exists', (t) => {
    const [script] = readConfig().mcpServers.putout.args;
    const result = existsSync(join(ROOT, script));
    
    t.ok(result);
    t.end();
});

test('setup: the README lists every tool', (t) => {
    const server = createServer() as unknown as Holder;
    const isMissing = (name: string) => !README.includes(`\`${name}\``);
    
    const result = Object
        .keys(server._registeredTools)
        .filter(isMissing);
    
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('setup: the README names the new_rule prompt', (t) => {
    t.match(README, '/mcp__putout__new_rule');
    t.end();
});

test('setup: the README has no remote mode, dist or npm', (t) => {
    const isPresent = (word: string) => README.includes(word);
    const result = [
        'USE_HTTP',
        'BASE_URL',
        'dist/index.js',
        'npm ',
    ].filter(isPresent);
    
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

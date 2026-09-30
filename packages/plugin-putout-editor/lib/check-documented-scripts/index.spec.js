import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as checkDocumentedScripts from './index.js';

const plugin = ['check-documented-scripts', checkDocumentedScripts];

const asScript = (name) => `"${name}":"node -e ''"`;

const scripts = (names) => `{"scripts":{${names
    .map(asScript)
    .join(',')}}}`;

const sourceOf = (...files) => print(parseFilesystem(['/', ...files]));

const scan = (...files) => putout(sourceOf(...files), {
    fix: false,
    plugins: [
        ['filesystem', plugin],
    ],
}).places;

const scanTree = (tree) => putout(print(parseFilesystem(tree)), {
    fix: false,
    plugins: [
        ['filesystem', plugin],
    ],
}).places;

test('putout-editor: check-documented-scripts: an absolute path, as redlint builds it', (t) => {
    const result = scanTree({
        type: 'directory',
        filename: '/home/user/repo',
        files: [{
            type: 'file',
            filename: '/home/user/repo/package.json',
            content: scripts(['lint']),
        }, {
            type: 'file',
            filename: '/home/user/repo/AGENTS.md',
            content: 'Run `bun run check` first\n',
        }],
    }).length;
    
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: the nearest package.json wins', (t) => {
    const [place] = scanTree({
        type: 'directory',
        filename: '/repo',
        files: [{
            type: 'file',
            filename: '/repo/package.json',
            content: scripts(['lint']),
        }, {
            type: 'directory',
            filename: '/repo/packages/app',
            files: [{
                type: 'file',
                filename: '/repo/packages/app/package.json',
                content: scripts(['build']),
            }, {
                type: 'file',
                filename: '/repo/packages/app/AGENTS.md',
                content: 'Run `bun run build` and `bun run lint` first\n',
            }],
        }],
    });
    
    const result = place.message;
    const expected = '☝️ AGENTS.md: documents scripts that do not exist: lint';
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: a script that does not exist', (t) => {
    const [place] = scan(['/package.json', scripts(['lint'])], [
        '/AGENTS.md',
        'Run `bun run check` first\n',
    ]);
    
    const result = place.message;
    const expected = '☝️ AGENTS.md: documents scripts that do not exist: check';
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: one report for the document', (t) => {
    const places = scan(['/package.json', scripts(['lint'])], [
        '/AGENTS.md',
        'Run `bun run check` and `bun run test:one`\n',
    ]);
    
    const result = places.length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: names every missing script', (t) => {
    const [place] = scan(['/package.json', scripts(['lint'])], [
        '/AGENTS.md',
        '`bun run check` and `npx madrun test:one`\n',
    ]);
    
    const result = place.message;
    const expected = '☝️ AGENTS.md: documents scripts that do not exist: check, test:one';
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: every documented script exists', (t) => {
    const result = scan(['/package.json', scripts(['check', 'lint', 'test'])], [
        '/AGENTS.md',
        'Run `bun run check`, `bun run lint` and `npx madrun test`\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: a flag is not a script', (t) => {
    const result = scan(['/package.json', scripts(['lint'])], [
        '/AGENTS.md',
        'Run `madrun --init` and the fixture does pass\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: prose is not a command', (t) => {
    const result = scan(['/package.json', scripts(['lint'])], [
        '/AGENTS.md',
        'Any script madrun does not own, and madrun passes no positional args\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: no package.json', (t) => {
    const result = scan([
        '/AGENTS.md',
        'Run `bun run check` first\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: package.json without scripts', (t) => {
    const result = scan([
        '/package.json',
        '{"name":"nothing"}',
    ], [
        '/AGENTS.md',
        'Run `bun run check` first\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: another document', (t) => {
    const result = scan(['/package.json', scripts(['lint'])], [
        '/docs/ideas.md',
        'Run `bun run check` first\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: package.json that does not parse', (t) => {
    const result = scan(['/package.json', '{not json'], [
        '/AGENTS.md',
        'Run `bun run check` first\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: package.json that is null', (t) => {
    const result = scan(['/package.json', 'null'], [
        '/AGENTS.md',
        'Run `bun run check` first\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: scripts is null', (t) => {
    const result = scan([
        '/package.json',
        '{"scripts":null}',
    ], [
        '/AGENTS.md',
        'Run `bun run check` first\n',
    ]).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: a document with no content', (t) => {
    const result = scan(['/package.json', scripts(['lint'])], ['/AGENTS.md', '']).length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-documented-scripts: report only, nothing is rewritten', (t) => {
    const files = [
        ['/package.json', scripts(['lint'])],
        ['/AGENTS.md', 'Run `bun run check` first\n'],
    ];
    
    const {code} = putout(sourceOf(...files), {
        fixCount: 1,
        plugins: [
            ['filesystem', plugin],
        ],
    });
    
    const result = code;
    const expected = sourceOf(...files);
    
    t.equal(result, expected);
    t.end();
});

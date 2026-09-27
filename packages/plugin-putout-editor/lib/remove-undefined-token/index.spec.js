import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as removeUndefinedToken from './index.js';

const plugin = ['remove-undefined-token', removeUndefinedToken];

const ROOT = '/project';

const TOKENS = ':root {\n    --color-accent: #c00;\n}\n';

const sourceOf = (name, content) => print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/tokens.css`, TOKENS],
    [`${ROOT}/${name}`, content],
]));

const scan = (name, content) => putout(sourceOf(name, content), {
    fix: false,
    plugins: [
        ['filesystem', plugin],
    ],
}).places;

test('putout-editor: remove-undefined-token: report', (t) => {
    const result = scan('main.css', '.a {\n    color: var(--color-accent);\n}\n').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-undefined-token: report: undefined', (t) => {
    const result = scan('main.css', '.a {\n    color: var(--color-nope);\n}\n')[0].message;
    const expected = `☝️ ${ROOT}/main.css: not in tokens.css: --color-nope`;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-undefined-token: report: once per token', (t) => {
    const result = scan('main.css', '.a {\n    color: var(--nope);\n    background: var(--nope);\n}\n')[0].message;
    const expected = `☝️ ${ROOT}/main.css: not in tokens.css: --nope`;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-undefined-token: report: skips tokens.css', (t) => {
    const result = scan('tokens.css', '.a {\n    color: var(--color-nope);\n}\n').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-undefined-token: no report: no tokens.css', (t) => {
    const source = print(parseFilesystem([
        '/',
        `${ROOT}/`,
        [
            `${ROOT}/main.css`,
            '.a {\n    color: var(--color-nope);\n}\n',
        ],
    ]));
    
    const result = putout(source, {
        fix: false,
        plugins: [
            ['filesystem', plugin],
        ],
    }).places.length;
    
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-undefined-token: report: empty tokens.css', (t) => {
    const source = print(parseFilesystem([
        '/',
        `${ROOT}/`,
        [`${ROOT}/tokens.css`, ''],
        [`${ROOT}/empty.css`, ''],
        [`${ROOT}/main.css`, '.a {\n    color: var(--color-nope);\n}\n'],
    ]));
    
    const result = putout(source, {
        fix: false,
        plugins: [
            ['filesystem', plugin],
        ],
    }).places.length;
    
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-undefined-token: report only, the file is unchanged', (t) => {
    const css = '.a {\n    color: var(--color-nope);\n}\n';
    const {code} = putout(sourceOf('main.css', css), {
        fixCount: 1,
        plugins: [
            ['filesystem', plugin],
        ],
    });
    
    const result = code.includes(
        JSON
            .stringify(css)
            .slice(1, -1),
    );
    
    t.ok(result);
    t.end();
});

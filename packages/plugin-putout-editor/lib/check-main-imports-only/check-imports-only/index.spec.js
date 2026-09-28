import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as checkMainImportsOnly from '../index.js';

const ROOT = '/project';
const MESSAGE = 'main.css is an entry point: @import only';

const fixture = (name) => readFileSync(new URL(`./fixture/${name}.css`, import.meta.url), 'utf8');

const contentOf = (source) => {
    const [, base64] = /"content":\s*"([A-Za-z0-9+/=]+)"/.exec(source);
    
    return Buffer
        .from(base64, 'base64')
        .toString();
};

const run = (name, content, {fix = false} = {}) => putout(print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/${name}`, content],
])), {
    ...fix && {
        fixCount: 1,
    },
    fix,
    plugins: [
        ['filesystem', ['check-main-imports-only', checkMainImportsOnly]],
    ],
});

const scan = (name, content) => run(name, content).places;

test('putout-editor: check-imports-only: a rule in main.css', (t) => {
    const result = scan('main.css', fixture('check-imports-only')).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-imports-only: imports only', (t) => {
    const result = scan('main.css', fixture('is-imports-only')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-imports-only: an at-rule that is not an import', (t) => {
    const result = scan('main.css', fixture('at-rule')).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-imports-only: an empty main.css', (t) => {
    const result = scan('main.css', fixture('empty')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-imports-only: report only: which file a rule belongs in is a judgement call', (t) => {
    const css = fixture('check-imports-only');
    const {code} = run('main.css', css, {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = css;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-imports-only: report: the message', (t) => {
    const result = scan('main.css', fixture('check-imports-only'))[0].message;
    const expected = `☝️ ${ROOT}/main.css: ${MESSAGE}`;
    
    t.equal(result, expected);
    t.end();
});

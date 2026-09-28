import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as checkMainImportsOnly from './index.js';

const ROOT = '/project';
const plugin = ['check-main-imports-only', checkMainImportsOnly];
const fixture = (name) => readFileSync(new URL(`./fixture/${name}.css`, import.meta.url), 'utf8');

const sourceOf = (name, content) => print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/${name}`, content],
]));

const scan = (name, content) => putout(sourceOf(name, content), {
    fix: false,
    plugins: [
        ['filesystem', plugin],
    ],
}).places;

test('putout-editor: check-main-imports-only: a rule in main.css', (t) => {
    const [place] = scan('main.css', fixture('not-imports-only'));
    
    const result = place.message;
    const expected = `☝️ ${ROOT}/main.css: main.css is an entry point: @import only`;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-main-imports-only: an at-rule that is not an import', (t) => {
    const result = scan('main.css', fixture('at-rule')).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-main-imports-only: imports only', (t) => {
    const result = scan('main.css', fixture('check-main-imports-only')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-main-imports-only: another file', (t) => {
    const result = scan('layout.css', fixture('another-file')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

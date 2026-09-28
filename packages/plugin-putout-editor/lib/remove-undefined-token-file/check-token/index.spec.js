import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as removeUndefinedTokenFile from '../index.js';

const ROOT = '/project';

const fixture = (name) => readFileSync(new URL(`./fixture/${name}.css`, import.meta.url), 'utf8');

const sourceOf = (name, content) => print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/tokens.css`, fixture('tokens')],
    [`${ROOT}/${name}`, content],
]));

const run = (name, content, {fix = false} = {}) => putout(sourceOf(name, content), {
    ...fix && {
        fixCount: 1,
    },
    fix,
    plugins: [
        ['filesystem', ['remove-undefined-token-file', removeUndefinedTokenFile]],
    ],
});

const scan = (name, content) => run(name, content).places;

test('putout-editor: check-token: a token tokens.css does not define', (t) => {
    const result = scan('main.css', fixture('check-token')).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-token: report: the name', (t) => {
    const result = scan('main.css', fixture('check-token'))[0].message;
    const expected = `☝️ ${ROOT}/main.css: not in tokens.css: --color-missing`;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-token: a token tokens.css defines', (t) => {
    const result = scan('main.css', fixture('is-known')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-token: a stylesheet that does not parse is left alone', (t) => {
    const result = scan('main.css', fixture('broken')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: check-token: report only: the token name is a human call', (t) => {
    const css = fixture('check-token');
    const {code} = run('main.css', css, {
        fix: true,
    });
    
    const result = code;
    const expected = sourceOf('main.css', css);
    
    t.equal(result, expected);
    t.end();
});

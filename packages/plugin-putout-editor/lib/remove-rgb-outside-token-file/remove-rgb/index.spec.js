import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as removeRgbOutsideTokenFile from '../index.js';

const ROOT = '/project';
const MESSAGE = 'colours belong in tokens.css, reach for a var() instead';

const fixture = (name) => readFileSync(new URL(`./fixture/${name}.css`, import.meta.url), 'utf8');

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
        ['filesystem', ['remove-rgb-outside-token-file', removeRgbOutsideTokenFile]],
    ],
});

const scan = (name, content) => run(name, content).places;

const contentOf = (source) => {
    const [, base64] = /"content":\s*"([A-Za-z0-9+/=]+)"/.exec(source);
    
    return Buffer
        .from(base64, 'base64')
        .toString();
};

test('putout-editor: remove-rgb: report', (t) => {
    const result = scan('main.css', fixture('remove-rgb')).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-rgb: report: the message', (t) => {
    const result = scan('main.css', fixture('remove-rgb'))[0].message;
    const expected = `☝️ ${ROOT}/main.css: ${MESSAGE}`;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-rgb: a var is not a colour', (t) => {
    const result = scan('main.css', fixture('remove-rgb-fix')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-rgb: report only: the token is a human call', (t) => {
    const css = fixture('remove-rgb');
    const {code} = run('main.css', css, {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = css;
    
    t.equal(result, expected);
    t.end();
});

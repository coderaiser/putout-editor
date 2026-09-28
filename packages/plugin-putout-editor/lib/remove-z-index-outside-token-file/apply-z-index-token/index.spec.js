import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as removeZIndexOutsideTokens from '../index.js';

const ROOT = '/project';
const MESSAGE = 'z-index belongs in tokens.css, reach for a var() instead';

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
        ['filesystem', ['remove-z-index-outside-token-file', removeZIndexOutsideTokens]],
    ],
});

const scan = (name, content) => run(name, content).places;

test('putout-editor: apply-z-index-token: report', (t) => {
    const result = scan('main.css', fixture('apply-z-index-token')).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-z-index-token: report: the message', (t) => {
    const result = scan('main.css', fixture('apply-z-index-token'))[0].message;
    const expected = String(MESSAGE);
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-z-index-token: a var is not a number', (t) => {
    const result = scan('main.css', fixture('is-token')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-z-index-token: report only: the token is a human call', (t) => {
    const css = fixture('apply-z-index-token');
    const {code} = run('main.css', css, {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = css;
    
    t.equal(result, expected);
    t.end();
});

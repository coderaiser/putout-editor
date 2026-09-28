import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as removeRgbOutsideTokens from './index.js';

const fixture = (name) => readFileSync(new URL(`./fixture/${name}.css`, import.meta.url), 'utf8');

const plugin = ['remove-rgb-outside-tokens', removeRgbOutsideTokens];

const ROOT = '/project';

const CSS_WITH_RGB = '.a {\n    box-shadow: 0 -4px 16px rgb(0 0 0 / 20%);\n}\n';

const sourceOf = (name, content) => print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/${name}`, content],
]));

const run = (name, content, {fix = false} = {}) => putout(sourceOf(name, content), {
    ...fix && {
        fixCount: 1,
    },
    fix,
    plugins: [
        ['filesystem', plugin],
    ],
});

const scan = (name, content) => run(name, content).places;

const contentOf = (source) => {
    const [, base64] = /"content":\s*"([A-Za-z0-9+/=]+)"/.exec(source);
    
    return Buffer
        .from(base64, 'base64')
        .toString();
};

test('putout-editor: remove-rgb-outside-tokens: report', (t) => {
    const result = scan('main.css', CSS_WITH_RGB)[0].message;
    const expected = `☝️ ${ROOT}/main.css: colours belong in tokens.css, reach for a var() instead`;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-rgb-outside-tokens: no report in tokens.css', (t) => {
    const result = scan('tokens.css', CSS_WITH_RGB).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-rgb-outside-tokens: no report for a var', (t) => {
    const result = scan('main.css', '.a {\n    color: var(--color-accent);\n}\n').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-rgb-outside-tokens: report only: the token is a human call', (t) => {
    const {code} = run('main.css', CSS_WITH_RGB, {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = CSS_WITH_RGB;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-rgb-outside-tokens: fixture', (t) => {
    const result = scan('main.css', fixture('remove-rgb-outside-tokens')).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-rgb-outside-tokens: fixture: a var is not a colour', (t) => {
    const result = scan('main.css', fixture('remove-rgb-outside-tokens-fix')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

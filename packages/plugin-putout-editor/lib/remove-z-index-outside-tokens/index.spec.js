import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as removeZIndexOutsideTokens from './index.js';

const fixture = (name) => readFileSync(new URL(`./fixture/${name}.css`, import.meta.url), 'utf8');

const plugin = ['remove-z-index-outside-tokens', removeZIndexOutsideTokens];

const ROOT = '/project';

const CSS_WITH_Z_INDEX = '.a {\n    z-index: 200;\n}\n';

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

const contentOf = (source) => {
    const [, base64] = /"content":\s*"([A-Za-z0-9+/=]+)"/.exec(source);
    
    return Buffer
        .from(base64, 'base64')
        .toString();
};

test('putout-editor: remove-z-index-outside-tokens: report', (t) => {
    const result = scan('dialog.css', CSS_WITH_Z_INDEX)[0].message;
    const expected = `☝️ ${ROOT}/dialog.css: z-index belongs in tokens.css, reach for a var() instead`;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-z-index-outside-tokens: no report in tokens.css', (t) => {
    const result = scan('tokens.css', CSS_WITH_Z_INDEX).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-z-index-outside-tokens: no report for a var', (t) => {
    const result = scan('dialog.css', '.a {\n    z-index: var(--z-dialog);\n}\n').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-z-index-outside-tokens: report only', (t) => {
    const {code} = putout(sourceOf(
        'dialog.css',
        CSS_WITH_Z_INDEX,
    ), {
        fixCount: 1,
        plugins: [
            ['filesystem', plugin],
        ],
    });
    
    const result = contentOf(code);
    const expected = CSS_WITH_Z_INDEX;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-z-index-outside-tokens: fixture: a numeric z-index', (t) => {
    const result = scan('main.css', fixture('remove-z-index-outside-tokens')).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: remove-z-index-outside-tokens: fixture: a var z-index', (t) => {
    const result = scan('main.css', fixture('remove-z-index-outside-tokens-fix')).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

import {Buffer} from 'node:buffer';
import {test} from 'supertape';
import {
    scanFilesystem,
    putoutFilesystem,
} from './helpers.js';
import * as removeRgbOutsideTokens from '../lib/remove-rgb-outside-tokens/index.js';

const MESSAGE = '☝️ /project/main.css: colours belong in tokens.css, reach for a var() instead';

const ROOT = '/project';

const files = (name, content) => [
    '/',
    `${ROOT}/`,
    [`${ROOT}/${name}`, content],
];

const scan = (name, content) => scanFilesystem(files(name, content), [
    'remove-rgb-outside-tokens',
    removeRgbOutsideTokens,
]).places;

const CSS_WITH_RGB = `.a {\n    box-shadow: 0 -4px 16px rgb(0 0 0 / 20%);\n}\n`;

test('remove-rgb-outside-tokens: reports rgb outside tokens.css', (t) => {
    const result = scan('main.css', CSS_WITH_RGB).length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('remove-rgb-outside-tokens: message names the fix', (t) => {
    const result = scan('main.css', CSS_WITH_RGB)[0].message;
    const expected = MESSAGE;
    
    t.equal(result, expected);
    t.end();
});

test('remove-rgb-outside-tokens: reports a hardcoded hex', (t) => {
    const result = scan('main.css', '.a {\n    color: #ff0000;\n}\n').length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('remove-rgb-outside-tokens: ignores tokens.css', (t) => {
    const result = scan('tokens.css', CSS_WITH_RGB).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('remove-rgb-outside-tokens: ignores a var() reference', (t) => {
    const result = scan('main.css', '.a {\n    color: var(--color-accent);\n}\n').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('remove-rgb-outside-tokens: leaves the css byte for byte, the token is a human decision', async (t) => {
    const {code} = await putoutFilesystem(files(
        'main.css',
        CSS_WITH_RGB,
    ), removeRgbOutsideTokens);
    
    const [content] = code
        .match(/"([A-Za-z0-9+/=]+)"/g)
        .slice(-1);
    
    const result = Buffer
        .from(content.replace(/"/g, ''), 'base64')
        .toString();
    
    const expected = CSS_WITH_RGB;
    
    t.equal(result, expected);
    t.end();
});

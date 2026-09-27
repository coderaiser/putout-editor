import {Buffer} from 'node:buffer';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as removeRgbOutsideTokens from '../lib/remove-rgb-outside-tokens/index.js';

const plugin = ['remove-rgb-outside-tokens', removeRgbOutsideTokens];

const ROOT = '/project';

const CSS_WITH_RGB = '.a {\n    box-shadow: 0 -4px 16px rgb(0 0 0 / 20%);\n}\n';

// a scanner sees a filesystem, not a source file, so the fixture is the simple
// json representation redlint builds - parsed and printed with the library's own
// helpers rather than hand-rolled
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

// the filesystem stores content base64 encoded, so compare what it decodes to -
// that is the assertion that matters: a report-only rule must not touch the file
const contentOf = (source) => {
    const [, base64] = /"content":\s*"([A-Za-z0-9+/=]+)"/.exec(source);
    
    return Buffer
        .from(base64, 'base64')
        .toString();
};

test('plugin-putout-editor: report: remove-rgb-outside-tokens', (t) => {
    const result = scan('main.css', CSS_WITH_RGB)[0].message;
    const expected = `☝️ ${ROOT}/main.css: colours belong in tokens.css, reach for a var() instead`;
    
    t.equal(result, expected);
    t.end();
});

test('plugin-putout-editor: no report: remove-rgb-outside-tokens in tokens.css', (t) => {
    const result = scan('tokens.css', CSS_WITH_RGB).length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('plugin-putout-editor: no report: remove-rgb-outside-tokens for a var', (t) => {
    const result = scan('main.css', '.a {\n    color: var(--color-accent);\n}\n').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('plugin-putout-editor: report only: the token is a human call', (t) => {
    const {code} = run('main.css', CSS_WITH_RGB, {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = CSS_WITH_RGB;
    
    t.equal(result, expected);
    t.end();
});

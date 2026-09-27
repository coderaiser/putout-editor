import {createTest} from '@putout/test';
import * as putoutEditor from '../lib/index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('plugin-putout-editor: transform: apply-type-check', (t) => {
    t.transform('apply-type-check');
    t.end();
});

test('plugin-putout-editor: report: apply-type-check', (t) => {
    t.reportCode(`const a = node.type === 'CallExpression';`, `Prefer the 'is' check from 'types' over a '.type' comparison`);
    t.end();
});

test('plugin-putout-editor: transform: press-modifier-case', (t) => {
    t.transform('press-modifier-case');
    t.end();
});

test('plugin-putout-editor: report: press-modifier-case', (t) => {
    t.reportCode(`page.keyboard.press('Control+V');`, `Lowercase the key after a modifier: a browser reports Ctrl+V as "v"`);
    t.end();
});

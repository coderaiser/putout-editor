import {createTest} from '@putout/test';
import * as putoutEditor from '../lib/index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('plugin-putout-editor: transform: press-modifier-case', (t) => {
    t.transform('press-modifier-case');
    t.end();
});

test('plugin-putout-editor: report: press-modifier-case', (t) => {
    t.reportCode(`page.keyboard.press('Control+V');`, `Lowercase the key after a modifier: a browser reports Ctrl+V as "v"`);
    t.end();
});

test('plugin-putout-editor: transform: remove-comments', (t) => {
    t.transform('remove-comments');
    t.end();
});

test('plugin-putout-editor: report: remove-comments', (t) => {
    t.reportCode(`// a comment\nconst a = 1;`, 'A rule says what the code already says');
    t.end();
});

test('plugin-putout-editor: noTransform: remove-duplicated-receiver', (t) => {
    t.noTransform('remove-duplicated-receiver');
    t.end();
});

test('plugin-putout-editor: report: remove-duplicated-receiver', (t) => {
    t.reportCode(`const a = getState() && getState().value;`, 'Bind the left side to a local: && calls it twice');
    t.end();
});

test('plugin-putout-editor: no report: remove-duplicated-receiver on a plain read', (t) => {
    t.noReportCode(`const d = q.r && q.r.s();`, 'Bind the left side to a local: && calls it twice');
    t.end();
});

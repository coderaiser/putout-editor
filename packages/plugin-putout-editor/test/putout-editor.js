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

test('plugin-putout-editor: transform: remove-duplicated-receiver', (t) => {
    t.transform('remove-duplicated-receiver');
    t.end();
});

test('plugin-putout-editor: report: remove-duplicated-receiver', (t) => {
    t.reportCode(`const value = getState().workbench && getState().workbench.code;`, 'Bind the left side of && to a local: it is evaluated twice');
    t.end();
});

test('plugin-putout-editor: no report: remove-duplicated-receiver on a plain read', (t) => {
    t.noReportCode(`const safe = q.r && q.r.s;`, 'Bind the left side of && to a local: it is evaluated twice');
    t.end();
});

test('plugin-putout-editor: no report: remove-duplicated-receiver on an identifier', (t) => {
    t.noReportCode(`const p = p && p.toString();`, 'Bind the left side of && to a local: it is evaluated twice');
    t.end();
});

test('plugin-putout-editor: report: remove-duplicated-receiver in an arrow body', (t) => {
    t.reportCode(`const label = (el) => el().text && el().text.trim();`, 'Bind the left side of && to a local: it is evaluated twice');
    t.end();
});

test('plugin-putout-editor: report: remove-duplicated-receiver in a return', (t) => {
    t.reportCode(`return el().text && el().text.trim();`, 'Bind the left side of && to a local: it is evaluated twice');
    t.end();
});

test('plugin-putout-editor: report: remove-duplicated-receiver when the name is taken', (t) => {
    t.reportCode(`const text = 'x';\nconst clash = f().text && f().text.value;`, 'Bind the left side of && to a local: it is evaluated twice');
    t.end();
});

import {createTest} from '@putout/test';
import * as removeDuplicatedReceiver from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['remove-duplicated-receiver', removeDuplicatedReceiver],
    ],
});

const REPORT = 'Bind the left side of && to a local: it is evaluated twice';

test('putout-editor: remove-duplicated-receiver: transform', (t) => {
    t.transform('remove-duplicated-receiver');
    t.end();
});

test('putout-editor: remove-duplicated-receiver: report', (t) => {
    t.reportCode(`const value = getState().workbench && getState().workbench.code;`, REPORT);
    t.end();
});

test('putout-editor: remove-duplicated-receiver: no report on a plain read', (t) => {
    t.noReportCode(`const safe = q.r && q.r.s;`, REPORT);
    t.end();
});

test('putout-editor: remove-duplicated-receiver: no report on an identifier', (t) => {
    t.noReportCode(`const p = p && p.toString();`, REPORT);
    t.end();
});

test('putout-editor: remove-duplicated-receiver: report in an arrow body', (t) => {
    t.reportCode(`const label = (el) => el().text && el().text.trim();`, REPORT);
    t.end();
});

test('putout-editor: remove-duplicated-receiver: report in a return', (t) => {
    t.reportCode(`return el().text && el().text.trim();`, REPORT);
    t.end();
});

test('putout-editor: remove-duplicated-receiver: report when the name is taken', (t) => {
    t.reportCode(`const text = 'x';\nconst clash = f().text && f().text.value;`, REPORT);
    t.end();
});

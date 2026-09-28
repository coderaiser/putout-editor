import {createTest} from '@putout/test';
import * as removeDuplicatedReceiver from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['remove-duplicated-receiver', removeDuplicatedReceiver],
    ],
});

test('putout-editor: remove-duplicated-receiver: a declaration', (t) => {
    t.transform('declaration');
    t.end();
});

test('putout-editor: remove-duplicated-receiver: a return', (t) => {
    t.transform('return');
    t.end();
});

test('putout-editor: remove-duplicated-receiver: an arrow body', (t) => {
    t.transform('arrow');
    t.end();
});

test('putout-editor: remove-duplicated-receiver: a plain read is left alone', (t) => {
    t.noTransform('plain-read');
    t.end();
});

test('putout-editor: remove-duplicated-receiver: a taken name is left alone', (t) => {
    t.noTransform('taken-name');
    t.end();
});

test('putout-editor: remove-duplicated-receiver: reports a declaration', (t) => {
    t.report('declaration', 'Bind the left side of && to a local: it is evaluated twice');
    t.end();
});

test('putout-editor: remove-duplicated-receiver: reports an arrow body', (t) => {
    t.report('arrow', 'Bind the left side of && to a local: it is evaluated twice');
    t.end();
});

test('putout-editor: remove-duplicated-receiver: does not report a plain read', (t) => {
    t.noReport('plain-read');
    t.end();
});

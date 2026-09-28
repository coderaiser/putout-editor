import {createTest} from '@putout/test';
import * as removeDuplicatedReceiver from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['remove-duplicated-receiver', removeDuplicatedReceiver],
    ],
});

// This rule fixes, so every shape it claims to fix is tested with `t.transform` against
// its own fixture. The message is inlined on purpose: `t.report` reads the fixture for the
// code, so the only thing the test has to say is what it expects to be told.
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


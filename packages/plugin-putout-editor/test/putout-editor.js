import {createTest} from '@putout/test';
import * as putoutEditor from '../lib/index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('putout: plugin: putout-editor: transform: apply-press-modifier-case', (t) => {
    t.transform('apply-press-modifier-case');
    t.end();
});

test('putout: plugin: putout-editor: no transform: check-documented-scripts', (t) => {
    t.noTransform('check-documented-scripts');
    t.end();
});

test('putout: plugin: putout-editor: no transform: check-main-imports-in-file', (t) => {
    t.noTransform('check-main-imports-in-file');
    t.end();
});

test('putout: plugin: putout-editor: no transform: remove-comments', (t) => {
    t.noTransform('remove-comments');
    t.end();
});

test('putout: plugin: putout-editor: no transform: remove-rgb-outside-token-file', (t) => {
    t.noTransform('remove-rgb-outside-token-file');
    t.end();
});

test('putout: plugin: putout-editor: no transform: remove-undefined-token-file', (t) => {
    t.noTransform('remove-undefined-token-file');
    t.end();
});

test('putout: plugin: putout-editor: no transform: remove-z-index-outside-token-file', (t) => {
    t.noTransform('remove-z-index-outside-token-file');
    t.end();
});

import {createTest} from '@putout/test';
import putout from 'putout';
import * as checkCommentLength from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['check-comment-length', checkCommentLength],
    ],
});

const count = (source) => {
    const {places} = putout(source, {
        fix: false,
        plugins: [
            ['check-comment-length', checkCommentLength],
        ],
    });
    
    return places.length;
};

test('putout-editor: check-comment-length: report', (t) => {
    t.report('check-comment-length', 'Comment has 9 lines: at most 8');
    t.end();
});

test('putout-editor: check-comment-length: no transform', (t) => {
    t.noTransform('check-comment-length');
    t.end();
});

test('putout-editor: check-comment-length: no report: 8 lines', (t) => {
    t.noReport('short');
    t.end();
});

test('putout-editor: check-comment-length: report: a run of line comments', (t) => {
    t.report('line-run', 'Comment has 9 lines: at most 8');
    t.end();
});

test('putout-editor: check-comment-length: report: a trailing comment', (t) => {
    t.report('trailing', 'Comment has 9 lines: at most 8');
    t.end();
});

test('putout-editor: check-comment-length: report: an inner comment', (t) => {
    t.report('inner', 'Comment has 9 lines: at most 8');
    t.end();
});

test('putout-editor: check-comment-length: report: a property comment', (t) => {
    t.report('property', 'Comment has 9 lines: at most 8');
    t.end();
});

test('putout-editor: check-comment-length: report: a comment between two statements', (t) => {
    t.report('shared', 'Comment has 9 lines: at most 8');
    t.end();
});

test('putout-editor: check-comment-length: one place for a comment between two statements', (t) => {
    const source = `a();\n${'// x\n'.repeat(9)}b();\n`;
    const result = count(source);
    
    t.equal(result, 1);
    t.end();
});

test('putout-editor: check-comment-length: no place without comments', (t) => {
    const result = count('a();\n');
    
    t.equal(result, 0);
    t.end();
});

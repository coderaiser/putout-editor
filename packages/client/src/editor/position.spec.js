import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {posFromIndex, indexFromPos} from './position.js';

const state = EditorState.create({doc: 'hello world\nsecond line'});
const view = {state};
const doc = state.doc;

test('posFromIndex: returns null for negative index', (t) => {
    const result = posFromIndex(view, -1);
    t.equal(result, null);
    t.end();
});

test('posFromIndex: returns null for index beyond doc length', (t) => {
    const result = posFromIndex(view, doc.length + 1);
    t.equal(result, null);
    t.end();
});

test('posFromIndex: returns null for non-number index', (t) => {
    const result = posFromIndex(view, {line: 0, ch: 0});
    t.equal(result, null);
    t.end();
});

test('posFromIndex: returns null for NaN index', (t) => {
    const result = posFromIndex(view, NaN);
    t.equal(result, null);
    t.end();
});

test('posFromIndex: returns zero line for index zero', (t) => {
    const result = posFromIndex(view, 0);
    t.equal(result.line, 0);
    t.end();
});

test('posFromIndex: returns zero ch for index zero', (t) => {
    const result = posFromIndex(view, 0);
    t.equal(result.ch, 0);
    t.end();
});

test('indexFromPos: returns null when pos is null', (t) => {
    const result = indexFromPos(view, null);
    t.equal(result, null);
    t.end();
});

test('indexFromPos: returns null for non-object pos', (t) => {
    const result = indexFromPos(view, 42);
    t.equal(result, null);
    t.end();
});

test('indexFromPos: returns null for negative line', (t) => {
    const result = indexFromPos(view, {line: -1, ch: 0});
    t.equal(result, null);
    t.end();
});

test('indexFromPos: returns null for line beyond doc', (t) => {
    const result = indexFromPos(view, {line: 100, ch: 0});
    t.equal(result, null);
    t.end();
});

test('indexFromPos: returns null for non-number line', (t) => {
    const result = indexFromPos(view, {line: 'a', ch: 0});
    t.equal(result, null);
    t.end();
});

test('indexFromPos: returns null for negative ch', (t) => {
    const result = indexFromPos(view, {line: 0, ch: -1});
    t.equal(result, null);
    t.end();
});

test('indexFromPos: returns null for non-number ch', (t) => {
    const result = indexFromPos(view, {line: 0, ch: 'a'});
    t.equal(result, null);
    t.end();
});

test('indexFromPos: returns null for ch beyond line length', (t) => {
    const result = indexFromPos(view, {line: 0, ch: 100});
    t.equal(result, null);
    t.end();
});

test('indexFromPos: returns offset for valid position', (t) => {
    const result = indexFromPos(view, {line: 0, ch: 5});
    t.equal(result, 5);
    t.end();
});

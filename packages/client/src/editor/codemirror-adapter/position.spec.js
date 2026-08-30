import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {offsetToPosition, positionToOffset, posFromIndex, indexFromPos, getCursorIndex} from './position.js';

function makeView(document_ = 'hello\nworld') {
    const element = document.createElement('div');
    document.body.appendChild(element);
    return new EditorView({state: EditorState.create({doc: document_}), parent: element});
}

test('position: offsetToPosition line 0 ch 0 for offset 0', (t) => {
    const view = makeView();
    t.deepEqual(offsetToPosition(view.state.doc, 0), {line: 0, ch: 0});
    view.destroy();
    t.end();
});

test('position: offsetToPosition line 1 ch 0 for start of second line', (t) => {
    const view = makeView();
    t.deepEqual(offsetToPosition(view.state.doc, 6), {line: 1, ch: 0});
    view.destroy();
    t.end();
});

test('position: positionToOffset 0 for line 0 ch 0', (t) => {
    const view = makeView();
    t.equal(positionToOffset(view.state.doc, {line: 0, ch: 0}), 0);
    view.destroy();
    t.end();
});

test('position: positionToOffset 6 for start of second line', (t) => {
    const view = makeView();
    t.equal(positionToOffset(view.state.doc, {line: 1, ch: 0}), 6);
    view.destroy();
    t.end();
});

test('position: posFromIndex returns correct position', (t) => {
    const view = makeView();
    t.deepEqual(posFromIndex(view, 6), {line: 1, ch: 0});
    view.destroy();
    t.end();
});

test('position: indexFromPos returns correct offset', (t) => {
    const view = makeView();
    t.equal(indexFromPos(view, {line: 1, ch: 0}), 6);
    view.destroy();
    t.end();
});

test('position: getCursorIndex returns a number', (t) => {
    const view = makeView();
    t.equal(typeof getCursorIndex(view), 'number');
    view.destroy();
    t.end();
});
import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {
    offsetToPosition,
    positionToOffset,
    posFromIndex,
    indexFromPos,
    getCursorIndex,
} from './position.js';

function makeView(document_ = 'hello\nworld') {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    return new EditorView({
        state: EditorState.create({
            doc: document_,
        }),
        parent: element,
    });
}

test('position.js: offsetToPosition line 0 ch 0 for offset 0', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, 0);
    
    view.destroy();
    
    const expected = {
        line: 0,
        ch: 0,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('position.js: offsetToPosition clamps negative offset to start', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, -1);
    
    view.destroy();
    
    const expected = {
        line: 0,
        ch: 0,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('position.js: offsetToPosition clamps offset beyond end to end', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, 999);
    
    view.destroy();
    
    const expected = {
        line: 1,
        ch: 5,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('position.js: positionToOffset 0 for line 0 ch 0', (t) => {
    const view = makeView();
    const result = positionToOffset(view.state.doc, {
        line: 0,
        ch: 0,
    });
    
    view.destroy();
    
    t.equal(result, 0);
    t.end();
});

test('position.js: posFromIndex returns correct position', (t) => {
    const view = makeView();
    const result = posFromIndex(view, 6);
    
    view.destroy();
    
    const expected = {
        line: 1,
        ch: 0,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('position.js: indexFromPos returns correct offset', (t) => {
    const view = makeView();
    const result = indexFromPos(view, {
        line: 1,
        ch: 0,
    });
    
    view.destroy();
    
    t.equal(result, 6);
    t.end();
});

test('position.js: getCursorIndex returns a number', (t) => {
    const view = makeView();
    const result = typeof getCursorIndex(view);
    
    view.destroy();
    
    t.equal(result, 'number');
    t.end();
});

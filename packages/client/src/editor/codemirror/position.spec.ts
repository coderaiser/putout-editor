import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {
    offsetToPosition,
    positionToOffset,
    posFromIndex,
    indexFromPos,
    getCursorIndex,
} from './position.ts';

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

test('position: offsetToPosition line 0 ch 0 for offset 0', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, 0);
    
    const expected = {
        line: 0,
        ch: 0,
    };
    
    view.destroy();
    
    t.deepEqual(result, expected);
    t.end();
});

test('position: offsetToPosition line 1 ch 0 for start of second line', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, 6);
    
    const expected = {
        line: 1,
        ch: 0,
    };
    
    view.destroy();
    
    t.deepEqual(result, expected);
    t.end();
});

test('position: positionToOffset 0 for line 0 ch 0', (t) => {
    const view = makeView();
    const result = positionToOffset(view.state.doc, {
        line: 0,
        ch: 0,
    });
    
    const expected = 0;
    
    view.destroy();
    
    t.equal(result, expected);
    t.end();
});

test('position: positionToOffset 6 for start of second line', (t) => {
    const view = makeView();
    const result = positionToOffset(view.state.doc, {
        line: 1,
        ch: 0,
    });
    
    const expected = 6;
    
    view.destroy();
    
    t.equal(result, expected);
    t.end();
});

test('position: posFromIndex returns correct position', (t) => {
    const view = makeView();
    const result = posFromIndex(view, 6);
    
    const expected = {
        line: 1,
        ch: 0,
    };
    
    view.destroy();
    
    t.deepEqual(result, expected);
    t.end();
});

test('position: indexFromPos returns correct offset', (t) => {
    const view = makeView();
    const result = indexFromPos(view, {
        line: 1,
        ch: 0,
    });
    
    const expected = 6;
    
    view.destroy();
    
    t.equal(result, expected);
    t.end();
});

test('position: offsetToPosition clamps negative offset to start', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, -1);
    
    const expected = {
        line: 0,
        ch: 0,
    };
    
    view.destroy();
    
    t.deepEqual(result, expected);
    t.end();
});

test('position: offsetToPosition clamps offset beyond end to end', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, 999);
    
    const expected = {
        line: 1,
        ch: 5,
    };
    
    view.destroy();
    
    t.deepEqual(result, expected);
    t.end();
});

test('position: getCursorIndex returns a number', (t) => {
    const view = makeView();
    const result = typeof getCursorIndex(view);
    const expected = 'number';
    
    view.destroy();
    
    t.equal(result, expected);
    t.end();
});

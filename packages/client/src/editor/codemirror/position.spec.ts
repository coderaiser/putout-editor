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
import type {CharOffset} from '../../types.ts';

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

test('position.js: positionToOffset returns null for negative line', (t) => {
    const view = makeView('hello\nworld');
    const result = positionToOffset(view.state.doc, {
        line: -1,
        ch: 0,
    });
    
    view.destroy();
    
    t.notOk(result);
    t.end();
});

test('position.js: positionToOffset returns null for line beyond document', (t) => {
    const view = makeView('hello');
    const result = positionToOffset(view.state.doc, {
        line: 99,
        ch: 0,
    });
    
    view.destroy();
    
    t.notOk(result);
    t.end();
});

test('position: offsetToPosition returns null for undefined offset', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, undefined as unknown as CharOffset);
    
    view.destroy();
    
    t.notOk(result);
    t.end();
});

test('position: offsetToPosition returns null for NaN offset', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, NaN as unknown as CharOffset);
    
    view.destroy();
    
    t.notOk(result);
    t.end();
});

test('position: offsetToPosition returns null for object offset', (t) => {
    const view = makeView();
    const result = offsetToPosition(view.state.doc, ({
        column: 0,
        index: 0,
        line: 1,
    } as unknown) as CharOffset);
    
    view.destroy();
    
    t.notOk(result);
    t.end();
});

test('position: positionToOffset clamps offset beyond document end', (t) => {
    const view = makeView('hello');
    const result = positionToOffset(view.state.doc, {
        line: 0,
        ch: 100,
    });
    
    const expected = 5;
    
    view.destroy();
    
    t.equal(result, expected);
    t.end();
});

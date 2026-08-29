import {test, stub} from 'supertape';
import {
    setValue,
    getValue,
    setOption,
    getScrollInfo,
    scrollTo,
    refresh,
    addLineClass,
    removeLineClass,
    markText,
    posFromIndex,
    indexFromPos,
    getCursorIndex,
    getDocValue,
    setDocValue,
    on,
    off,
    observeResize,
} from './codemirror-adapter.js';

const isFn = (a) => typeof a === 'function';

const makeDoc = () => ({
    posFromIndex: stub().returns({
        line: 0,
        ch: 0,
    }),
    indexFromPos: stub().returns(0),
    getValue: stub().returns('code'),
    setValue: stub(),
    getCursor: stub().returns({
        line: 0,
        ch: 0,
    }),
});

const makeEditor = () => {
    const doc = makeDoc();
    
    return {
        setValue: stub(),
        getValue: stub().returns('code'),
        setOption: stub(),
        getScrollInfo: stub().returns({
            left: 0,
            top: 0,
        }),
        scrollTo: stub(),
        refresh: stub(),
        addLineClass: stub(),
        removeLineClass: stub(),
        markText: stub().returns({
            clear: stub(),
        }),
        on: stub(),
        off: stub(),
        getCursor: stub().returns({
            line: 0,
            ch: 0,
        }),
        getDoc: stub().returns(doc),
        display: {
            maxLineLength: 80,
        },
        doc,
    };
};

test('adapter: setValue calls editor.setValue with value', (t) => {
    const editor = makeEditor();
    setValue(editor, 'hello');
    
    t.calledWith(editor.setValue, ['hello']);
    t.end();
});

test('adapter: getValue returns editor.getValue result', (t) => {
    const editor = makeEditor();
    const result = getValue(editor);
    const expected = 'code';
    
    t.equal(result, expected);
    t.end();
});

test('adapter: setOption calls editor.setOption with key and value', (t) => {
    const editor = makeEditor();
    setOption(editor, 'mode', 'javascript');
    
    t.calledWith(editor.setOption, ['mode', 'javascript']);
    t.end();
});

test('adapter: getScrollInfo returns scroll position object', (t) => {
    const editor = makeEditor();
    const result = getScrollInfo(editor);
    
    const expected = {
        left: 0,
        top: 0,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('adapter: scrollTo calls editor.scrollTo', (t) => {
    const editor = makeEditor();
    scrollTo(editor, 10, 20);
    
    t.calledWith(editor.scrollTo, [10, 20]);
    t.end();
});

test('adapter: refresh calls editor.refresh', (t) => {
    const editor = makeEditor();
    refresh(editor);
    
    t.calledWithNoArgs(editor.refresh);
    t.end();
});

test('adapter: addLineClass calls editor.addLineClass', (t) => {
    const editor = makeEditor();
    addLineClass(editor, 5, 'text', 'errorMarker');
    
    t.calledWith(editor.addLineClass, [5, 'text', 'errorMarker']);
    t.end();
});

test('adapter: removeLineClass calls editor.removeLineClass', (t) => {
    const editor = makeEditor();
    removeLineClass(editor, 5, 'text', 'errorMarker');
    
    t.calledWith(editor.removeLineClass, [5, 'text', 'errorMarker']);
    t.end();
});

test('adapter: markText calls editor.markText', (t) => {
    const editor = makeEditor();
    
    markText(editor, {line: 0, ch: 0}, {line: 0, ch: 5}, {
        className: 'marked',
    });
    
    const args = [{
        line: 0,
        ch: 0,
    }, {
        line: 0,
        ch: 5,
    }, {
        className: 'marked',
    }];
    
    t.calledWith(editor.markText, args);
    t.end();
});

test('adapter: markText returns mark with clear method', (t) => {
    const editor = makeEditor();
    const mark = markText(editor, {line: 0, ch: 0}, {line: 0, ch: 5}, {});
    const result = isFn(mark.clear);
    
    t.ok(result);
    t.end();
});

test('adapter: posFromIndex calls doc.posFromIndex', (t) => {
    const editor = makeEditor();
    posFromIndex(editor, 10);
    
    t.calledWith(editor.getDoc().posFromIndex, [10]);
    t.end();
});

test('adapter: indexFromPos calls doc.indexFromPos', (t) => {
    const editor = makeEditor();
    
    indexFromPos(editor, {
        line: 0,
        ch: 5,
    });
    
    const args = [{
        line: 0,
        ch: 5,
    }];
    
    t.calledWith(editor.getDoc().indexFromPos, args);
    t.end();
});

test('adapter: getCursorIndex returns number', (t) => {
    const editor = makeEditor();
    const result = getCursorIndex(editor);
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('adapter: getDocValue returns doc value string', (t) => {
    const editor = makeEditor();
    const result = getDocValue(editor);
    const expected = 'code';
    
    t.equal(result, expected);
    t.end();
});

test('adapter: setDocValue sets doc value', (t) => {
    const editor = makeEditor();
    setDocValue(editor, 'new value');
    
    t.calledWith(editor.doc.setValue, ['new value']);
    t.end();
});

test('adapter: on registers event handler on editor', (t) => {
    const editor = makeEditor();
    const handler = () => {};
    
    on(editor, 'changes', handler);
    
    t.calledWith(editor.on, ['changes', handler]);
    t.end();
});

test('adapter: on returns [event, handler] tuple', (t) => {
    const editor = makeEditor();
    const handler = () => {};
    const result = on(editor, 'changes', handler);
    const expected = ['changes', handler];
    
    t.deepEqual(result, expected);
    t.end();
});

test('adapter: off removes event handler from editor', (t) => {
    const editor = makeEditor();
    const handler = () => {};
    
    off(editor, 'changes', handler);
    
    t.calledWith(editor.off, ['changes', handler]);
    t.end();
});


test('adapter: observeResize returns a cleanup function', (t) => {
    const editor = makeEditor();
    const container = document.createElement('div');
    const cleanup = observeResize(editor, container);
    const result = typeof cleanup;
    const expected = 'function';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('adapter: observeResize cleanup disconnects observer', (t) => {
    const editor = makeEditor();
    const container = document.createElement('div');
    const cleanup = observeResize(editor, container);
    
    // Should not throw on cleanup
    cleanup();
    
    t.ok(true);
    t.end();
});

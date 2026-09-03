import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {
    markField,
    lineField,
    markText,
    addLineClass,
    removeLineClass,
} from './decorations.js';

function makeView(document_ = 'hello world') {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    return new EditorView({
        state: EditorState.create({
            doc: document_,
            extensions: [markField, lineField],
        }),
        parent: element,
    });
}

test('decorations.js: markText returns object with clear function', (t) => {
    const view = makeView();
    const mark = markText(view, {line: 0, ch: 0}, {line: 0, ch: 5}, {
        className: 'marked',
    });
    
    const result = typeof mark.clear;
    
    view.destroy();
    
    t.equal(result, 'function');
    t.end();
});

test('decorations.js: markText adds one decoration to markField', (t) => {
    const view = makeView();
    
    markText(view, {line: 0, ch: 0}, {line: 0, ch: 5}, {
        className: 'marked',
    });
    
    view.destroy();
    
    t.equal(view.state.field(markField).size, 1);
    t.end();
});

test('decorations.js: mark clear removes all decorations from markField', (t) => {
    const view = makeView();
    const mark = markText(view, {line: 0, ch: 0}, {line: 0, ch: 5}, {
        className: 'marked',
    });
    
    mark.clear();
    
    view.destroy();
    
    t.equal(view.state.field(markField).size, 0);
    t.end();
});

test('decorations.js: markText empty range clear invokes noop', (t) => {
    const view = makeView();
    const mark = markText(view, {line: 0, ch: 0}, {line: 0, ch: 0}, {
        className: 'marked',
    });
    
    mark.clear();
    
    view.destroy();
    
    t.ok(true);
    t.end();
});

test('decorations.js: addLineClass adds decoration to lineField', (t) => {
    const view = makeView();
    addLineClass(view, 0, 'text', 'errorMarker');
    
    view.destroy();
    
    t.equal(view.state.field(lineField).size, 1);
    t.end();
});

test('decorations.js: removeLineClass removes decoration from lineField', (t) => {
    const view = makeView();
    addLineClass(view, 0, 'text', 'errorMarker');
    removeLineClass(view, 0, 'text', 'errorMarker');
    
    view.destroy();
    
    t.equal(view.state.field(lineField).size, 0);
    t.end();
});

test('decorations.js: removeLineClass for other line keeps decoration', (t) => {
    const view = makeView('a\nb');
    addLineClass(view, 0, 'text', 'errorMarker');
    removeLineClass(view, 1, 'text', 'errorMarker');
    
    view.destroy();
    
    t.equal(view.state.field(lineField).size, 1);
    t.end();
});

test('decorations.js: removeLineClass for other class keeps decoration', (t) => {
    const view = makeView();
    addLineClass(view, 0, 'text', 'errorMarker');
    removeLineClass(view, 0, 'text', 'otherClass');
    
    view.destroy();
    
    t.equal(view.state.field(lineField).size, 1);
    t.end();
});

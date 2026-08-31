import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import JSONEditor from './JSONEditor.js';
import {getView, getValue} from '../editor/codemirror/index.js';

test('JSONEditor: renders container with id', (t) => {
    const {container} = render(
        <JSONEditor value=""/>,
    );
    
    const result = container.querySelector('#JSONEditor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('JSONEditor: applies className', (t) => {
    const {container} = render(
        <JSONEditor value="" className="editor-class"/>,
    );
    
    const result = container.querySelector('#JSONEditor').className;
    
    cleanup();
    
    t.equal(result, 'editor-class');
    t.end();
});

test('JSONEditor: creates CodeMirror editor on mount', (t) => {
    const {container} = render(
        <JSONEditor value="const a = 1"/>,
    );
    
    const editor = getView(container);
    
    cleanup();
    
    t.ok(editor);
    t.end();
});

test('JSONEditor: cleanup removes editor child on unmount', (t) => {
    const {container, unmount} = render(
        <JSONEditor value="const a = 1"/>,
    );
    
    unmount();
    const children = container.querySelectorAll('.cm-editor').length;
    
    t.equal(children, 0);
    t.end();
});

test('JSONEditor: updates editor value when value changes', (t) => {
    const {container, rerender} = render(
        <JSONEditor value="const a = 1"/>,
    );
    
    rerender(
        <JSONEditor value="const b = 2"/>,
    );
    
    const editor = getView(container);
    const value = editor ? getValue(editor) : null;
    
    cleanup();
    
    t.equal(value, 'const b = 2');
    t.end();
});

test('JSONEditor: does not update when value unchanged', (t) => {
    const {container, rerender} = render(
        <JSONEditor value="const a = 1"/>,
    );
    
    rerender(
        <JSONEditor value="const a = 1"/>,
    );
    
    const editor = getView(container);
    const value = editor ? getValue(editor) : null;
    
    cleanup();
    
    t.equal(value, 'const a = 1');
    t.end();
});

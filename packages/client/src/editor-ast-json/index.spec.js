import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import EditorASTJson from '#editor-ast-json';
import {getView, getValue} from '../editor/codemirror/index.js';

const {stringify} = JSON;

test('EditorASTJson: renders container element', (t) => {
    const {container} = render(
        <EditorASTJson value="{}"/>,
    );
    
    const result = container.querySelector('#EditorASTJson');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('EditorASTJson: renders with default props', (t) => {
    const {container} = render(
        <EditorASTJson/>,
    );
    
    const result = container.querySelector('#EditorASTJson');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('EditorASTJson: renders with className', (t) => {
    const {container} = render(
        <EditorASTJson className="ast-view" value="{}"/>,
    );
    
    const result = container.querySelector('.ast-view');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('EditorASTJson: renders with parseResult uses ast value', (t) => {
    const {container} = render(
        <EditorASTJson
            parseResult={{
                ast: {
                    type: 'File',
                },
            }}
        />,
    );
    
    const result = container.querySelector('#EditorASTJson');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('EditorASTJson: creates CodeMirror editor on mount', (t) => {
    const {container} = render(
        <EditorASTJson value="{}"/>,
    );
    
    const editor = getView(container);
    
    cleanup();
    
    t.ok(editor);
    t.end();
});

test('EditorASTJson: cleanup removes editor child on unmount', (t) => {
    const {container, unmount} = render(
        <EditorASTJson value="{}"/>,
    );
    
    unmount();
    const children = container.querySelectorAll('.cm-editor').length;
    
    t.equal(children, 0);
    t.end();
});

test('EditorASTJson: updates editor value when value changes', (t) => {
    const {container, rerender} = render(
        <EditorASTJson value="{}"/>,
    );
    
    rerender(
        <EditorASTJson
            value={stringify({
                type: 'File',
            })}
        />,
    );
    
    const editor = getView(container);
    const result = editor ? getValue(editor) : null;
    
    cleanup();
    
    t.equal(result, '{"type":"File"}');
    t.end();
});

test('EditorASTJson: does not update when value unchanged', (t) => {
    const {container, rerender} = render(
        <EditorASTJson value="{}"/>,
    );
    
    rerender(
        <EditorASTJson value="{}"/>,
    );
    
    const editor = getView(container);
    const result = editor ? getValue(editor) : null;
    
    cleanup();
    
    t.equal(result, '{}');
    t.end();
});

import {test} from 'supertape';
import {createEditor} from 'qword/client';
import {
    commandEndOf,
    markCommand,
    noMark,
} from './commandMark.ts';

const editorOf = (value: string) => {
    const container = document.createElement('div');
    
    document.body.append(container);
    
    const editor = createEditor(container, {
        value,
    });
    
    const destroy = () => {
        editor.destroy();
        container.remove();
    };
    
    return {
        editor,
        destroy,
    };
};

const markedText = (editor: {
    contentDOM: HTMLElement;
}) => {
    const marked = editor.contentDOM.querySelector('.input__command');
    
    return marked && marked.textContent;
};

test('commandMark: the command ends after the first word', (t) => {
    const result = commandEndOf('/source const a = 1;');
    const expected = 7;
    
    t.equal(result, expected);
    t.end();
});

test('commandMark: the command ends at the line break', (t) => {
    const result = commandEndOf('/ast\nconst a = 1;');
    const expected = 4;
    
    t.equal(result, expected);
    t.end();
});

test('commandMark: a line with no sigil has no command', (t) => {
    const result = commandEndOf('const a = 1;');
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('commandMark: noMark clears nothing', (t) => {
    const result = typeof noMark.clear();
    const expected = 'undefined';
    
    t.equal(result, expected);
    t.end();
});

test('commandMark: markCommand marks the command word', (t) => {
    const {editor, destroy} = editorOf('/source\nconst a = 1;');
    
    markCommand(editor, noMark);
    
    const result = markedText(editor);
    const expected = '/source';
    
    destroy();
    
    t.equal(result, expected);
    t.end();
});

test('commandMark: markCommand clears the previous mark', (t) => {
    const {editor, destroy} = editorOf('/source\nconst a = 1;');
    const first = markCommand(editor, noMark);
    
    editor.dispatch({
        changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: 'const a = 1;',
        },
    });
    
    markCommand(editor, first);
    
    const result = editor.contentDOM.querySelectorAll('.input__command').length;
    const expected = 0;
    
    destroy();
    
    t.equal(result, expected);
    t.end();
});

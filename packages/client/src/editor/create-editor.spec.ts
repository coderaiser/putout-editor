import {test} from 'supertape';
import {EditorState} from '@codemirror/state';
import {createEditor} from './create-editor.ts';

const withEditor = (value = 'abc\ndef\nghi') => {
    const element = document.createElement('div');
    document.body.append(element);
    
    return createEditor(element, {
        value,
        keyMap: 'vim',
    });
};

test('create-editor: allows multiple selections, which vim blockwise visual needs', (t) => {
    const editor = withEditor();
    const result = editor.state.facet(EditorState.allowMultipleSelections);
    
    t.ok(result);
    t.end();
});

test('create-editor: returns a view holding the initial value', (t) => {
    const editor = withEditor('const x = 1;');
    const result = editor.state.doc.toString();
    const expected = 'const x = 1;';
    
    t.equal(result, expected);
    t.end();
});

import {EditorState} from '@codemirror/state';
import {keymap} from '@codemirror/view';
import {history, historyKeymap} from '@codemirror/commands';
import {
    createEditor as createQwordEditor,
    type CreateEditorOptions,
    type QwordEditorView,
} from 'qword/client';

/**
 * Blockwise visual (`Ctrl-v`) needs one selection range per line. CodeMirror
 * keeps only the main range unless the state has `allowMultipleSelections`,
 * and `qword` does not add it. The facet is static, so put it in the history
 * compartment: nothing reconfigures it. See `docs/frontend.md` (Editor).
 */
const allowMultipleSelections = (view: QwordEditorView) => {
    view.dispatch({
        effects: view._historyCompartment.reconfigure([
            history(),
            keymap.of(historyKeymap),
            EditorState.allowMultipleSelections.of(true),
        ]),
    });
    
    return view;
};

export const createEditor = (element: Element, options?: CreateEditorOptions): QwordEditorView => {
    return allowMultipleSelections(createQwordEditor(element, options));
};

import {EditorState} from '@codemirror/state';
import {keymap} from '@codemirror/view';
import {history, historyKeymap} from '@codemirror/commands';
import {
    createEditor as createQwordEditor,
    type CreateEditorOptions,
    type QwordEditorView,
} from 'qword/client';

/**
 * Blockwise visual (`Ctrl-v`) is the only vim mode that needs more than one
 * selection range: for a block, `makeCmSelection` returns one range per line.
 *
 * CodeMirror 6 discards every range but the main one unless the state carries
 * `allowMultipleSelections` - see `resolveTransaction` in @codemirror/state:
 * `tr.startState.facet(allowMultipleSelections) ? tr.newSelection : tr.newSelection.asSingle()`.
 *
 * `qword` builds its own extension list instead of using `EditorView.basicSetup`,
 * which is where that facet normally comes from. So on a bare `qword` editor the
 * block never grows past a single line: `j`/`k` slide it down the buffer instead
 * of extending it, and `x` deletes one character instead of the whole column.
 * Verified against qword@1.1.22 + @replit/codemirror-vim@6.4.0.
 *
 * Full investigation, with the instrumented selection per keystroke: `docs/memory/editor-vim.md`.
 *
 * The facet is `static`, so it has to be in the state rather than toggled per
 * keystroke. The history compartment is the cheapest correct place to put it:
 * `qword` exposes it on the view type, its contents are stable, and nothing here
 * reconfigures it - unlike `_keymapCompartment`, which `setOption` swaps out
 * whenever the user changes key map.
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

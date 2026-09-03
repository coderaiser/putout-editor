import type {EditorView} from '@codemirror/view';
import type {SourceCode} from '../../types.ts';

export function setValue(view: EditorView, value: SourceCode): void {
    view.dispatch({
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: value,
        },
    });
}

export const getValue = (view: EditorView): SourceCode => view.state.doc.toString();

export const getDocValue = getValue;
export const setDocValue = setValue;

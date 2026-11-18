import {
    createEditor,
    getValue,
    type MarkHandle,
} from 'qword/client';
import {markCommand, noMark} from './commandMark.ts';

/** The part of a key event that the box passes on. */
export interface KeyLike {
    key: string;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    preventDefault(): void;
}

export interface ControlledEditorOptions {
    value: string;
    lineNumbers?: boolean;
    
    /** Take the focus after the build. A rebuild asks for it, a first mount does not. */
    focus?: boolean;
    onChange(value: string): void;
    onKeyDown(event: KeyLike): void;
}

/** `setValue` takes an outside value: the text goes in and the caret goes to the end. */
export interface ControlledEditor {
    setValue(value: string): void;
    destroy(): void;
}

/**
 * A CodeMirror 6 editor that acts like a controlled `<textarea>`, with no
 * React in it. `onChange` reports what the user typed. `setValue` takes what
 * the owner decided. `lastValue` drops the echo of one into the other.
 */
export const createControlledEditor = (container: HTMLElement, options: ControlledEditorOptions): ControlledEditor => {
    const {
        value,
        lineNumbers,
        focus,
        onChange,
        onKeyDown,
    } = options;
    
    let lastValue = value;
    let mark: MarkHandle = noMark;
    let alive = true;
    
    const editor = createEditor(container, {
        value,
        mode: 'javascript',
        lineNumbers,
        updateListener: (update) => {
            if (!update.docChanged)
                return;
            
            // a mark dispatches, and a dispatch inside an update throws
            queueMicrotask(() => {
                if (alive)
                    mark = markCommand(editor, mark);
            });
            
            const next = getValue(editor);
            
            if (next === lastValue)
                return;
            
            lastValue = next;
            onChange(next);
        },
    });
    
    // The box takes command names, not prose: the same three opt-outs
    // the `<textarea>` carried, set where CodeMirror owns the DOM.
    editor.contentDOM.setAttribute('autocapitalize', 'none');
    editor.contentDOM.setAttribute('autocorrect', 'off');
    editor.contentDOM.setAttribute('spellcheck', 'false');
    
    const onKey = (event: KeyboardEvent) => {
        let prevented = false;
        
        onKeyDown({
            key: event.key,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            preventDefault: () => {
                prevented = true;
            },
        });
        
        if (prevented) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    
    // A native capture-phase `keydown`, not a `keymap`: `createEditor` takes no
    // `extensions`. When `onKeyDown` prevents the key, CodeMirror does not get it.
    container.addEventListener('keydown', onKey, true);
    
    mark = markCommand(editor, noMark);
    
    // A new editor puts the caret at 0. Put it at the end: a history recall can come first.
    editor.dispatch({
        selection: {
            anchor: editor.state.doc.length,
        },
    });
    
    if (focus)
        editor.focus();
    
    return {
        setValue: (next) => {
            if (next === lastValue)
                return;
            
            lastValue = next;
            
            const cursor = next.length;
            
            editor.dispatch({
                changes: {
                    from: 0,
                    to: editor.state.doc.length,
                    insert: next,
                },
                selection: {
                    anchor: cursor,
                },
            });
            
            /*
             * With a full-document replace, CodeMirror leaves the DOM caret at 0.
             * Restore it in `requestAnimationFrame`: a microtask runs before the
             * selection sync of CodeMirror. Skip a stale frame (the editor is gone,
             * or the text changed): `domAtPos` throws there. Do not cancel in a
             * cleanup: StrictMode would cancel the only frame.
             */
            requestAnimationFrame(() => {
                const stale = !alive || editor.state.doc.length !== cursor;
                
                if (stale)
                    return;
                
                const {node, offset} = editor.domAtPos(cursor);
                const selection = document.getSelection();
                
                if (selection) {
                    selection.removeAllRanges();
                    selection.collapse(node, offset);
                }
            });
        },
        destroy: () => {
            alive = false;
            container.removeEventListener('keydown', onKey, true);
            editor.destroy();
        },
    };
};

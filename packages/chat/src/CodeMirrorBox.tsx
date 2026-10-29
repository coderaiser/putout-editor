import './css/highlight.css';
import {
    useEffect,
    useRef,
    type KeyboardEvent,
} from 'react';
import {
    createEditor,
    getValue,
    setOption,
    type QwordEditorView,
} from 'qword/client';
import {markCommand, noMark} from './commandMark.ts';

export interface CodeMirrorBoxProps {
    'className'?: string;
    'data-testid'?: string;
    
    /**
     * The gutter. Off by default: a command name is one line. `Input` turns
     * it on for a command with a body (`source`, `find`, `transform`,
     * `validate`).
     */
    'lineNumbers'?: boolean;
    'onChange'(value: string): void;
    'onKeyDown'(event: KeyboardEvent<HTMLTextAreaElement>): void;
    'placeholder'?: string;
    'value': string;
}

/**
 * A controlled CodeMirror 6 editor that acts like a `<textarea>`. An outside
 * `value` change goes in with a dispatch. The echo of `onChange` is dropped
 * by `lastValueRef`. `mode: 'javascript'` highlights the body.
 * Keys: a native capture-phase `keydown` on the container, not a `keymap`:
 * `createEditor` takes no `extensions`. When the React `onKeyDown` calls
 * `preventDefault`, CodeMirror does not get the key.
 */
export default function CodeMirrorBox({className, 'data-testid': testId, lineNumbers, onChange, onKeyDown, placeholder, value}: CodeMirrorBoxProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<QwordEditorView | null>(null);
    const lastValueRef = useRef(value);
    const rebuildRef = useRef(false);
    const markRef = useRef(noMark);
    
    const onChangeRef = useRef(onChange);
    
    onChangeRef.current = onChange;
    
    const onKeyDownRef = useRef(onKeyDown);
    
    onKeyDownRef.current = onKeyDown;
    
    /* c8 ignore start - the editor is built once per `lineNumbers`, and that is
     * the only rerender path that reaches here. `lineNumbers` is a prop
     * `createEditor` reads at construction — CodeMirror has no setter for it —
     * so a change to it cannot be pushed into a live editor and has to rebuild
     * one, which is what putting it in the deps does: the cleanup destroys the
     * old view and this runs again with the new option. `lastValueRef` keeps the
     * text across the rebuild, so the second effect does not then push it in a
     * second time. */
    useEffect(() => {
        const container = containerRef.current!;
        const editor = createEditor(container, {
            value,
            mode: 'javascript',
            lineNumbers,
            updateListener: (update) => {
                if (!update.docChanged)
                    return;
                
                // a mark dispatches, and a dispatch inside an update throws
                queueMicrotask(() => {
                    if (editorRef.current === editor)
                        markRef.current = markCommand(editor, markRef.current);
                });
                
                const next = getValue(editor);
                
                if (next === lastValueRef.current)
                    return;
                
                lastValueRef.current = next;
                onChangeRef.current(next);
            },
        });
        
        // The box takes command names, not prose: the same three opt-outs
        // the `<textarea>` carried, set where CodeMirror owns the DOM.
        editor.contentDOM.setAttribute('autocapitalize', 'none');
        editor.contentDOM.setAttribute('autocorrect', 'off');
        editor.contentDOM.setAttribute('spellcheck', 'false');
        
        const onKey = (event: globalThis.KeyboardEvent) => {
            let prevented = false;
            
            const synthetic = {
                key: event.key,
                shiftKey: event.shiftKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                preventDefault: () => {
                    prevented = true;
                },
            } as KeyboardEvent<HTMLTextAreaElement>;
            
            onKeyDownRef.current(synthetic);
            
            if (prevented) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        
        container.addEventListener('keydown', onKey, true);
        
        editorRef.current = editor;
        markRef.current = markCommand(editor, noMark);
        
        // Sync the echo so the `value` effect sees the editor already holds
        
        // the right content and does not push it in again on the next tick.
        lastValueRef.current = value;
        
        // A new editor puts the caret at 0. Put it at the end: a history recall can come first.
        editor.dispatch({
            selection: {
                anchor: editor.state.doc.length,
            },
        });
        
        // Only a rebuild takes focus back: it fires because the user completed
        
        // a body command (`/sou` -> `/source ` flips `lineNumbers`) mid-typing,
        
        // while a first mount must not steal focus from wherever it is.
        if (rebuildRef.current)
            editor.focus();
        
        rebuildRef.current = true;
        
        return () => {
            container.removeEventListener('keydown', onKey, true);
            editor.destroy();
            editorRef.current = null;
        };
    }, [lineNumbers]);
    
    /* c8 ignore end */
    
    // Set the language after mount: `_langCompartment` of qword is not ready before.
    useEffect(() => {
        if (editorRef.current)
            setOption(editorRef.current, 'mode', 'javascript');
    }, []);
    
    useEffect(() => {
        if (!editorRef.current)
            return;
        
        if (value === lastValueRef.current)
            return;
        
        lastValueRef.current = value;
        
        const editor = editorRef.current;
        const {state} = editor;
        
        /*
         * An outside `value` (completion, recall, Escape) puts the caret at the end.
         * The `onChange` echo does not come here: `lastValueRef` drops it.
         */
        const cursorPos = value.length;
        
        editor.dispatch({
            changes: {
                from: 0,
                to: state.doc.length,
                insert: value,
            },
            selection: {
                anchor: cursorPos,
            },
        });
        
        /*
         * With a full-document replace, CodeMirror leaves the DOM caret at 0.
         * Restore it in `requestAnimationFrame`: a microtask runs before the
         * selection sync of CodeMirror. Skip a stale frame (editor rebuilt, or
         * the text changed): `domAtPos` throws there. Do not cancel in a
         * cleanup: StrictMode would cancel the only frame.
         */
        requestAnimationFrame(() => {
            const stale = editorRef.current !== editor || editor.state.doc.length !== cursorPos;
            
            if (stale)
                return;
            
            const {node, offset} = editor.domAtPos(cursorPos);
            const sel = document.getSelection();
            
            if (sel) {
                sel.removeAllRanges();
                sel.collapse(node, offset);
            }
        });
    }, [value]);
    
    return (
        <div
            className={[!value && 'input__box--empty', className]
                .filter(Boolean)
                .join(' ') || undefined}
            data-placeholder={placeholder}
            data-testid={testId}
            ref={containerRef}
        />
    );
}

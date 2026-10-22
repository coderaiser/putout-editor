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

export interface CodeMirrorBoxProps {
    'className'?: string;
    'data-testid'?: string;
    
    /**
     * The gutter. Off by default, because a command name is one line and a
     * gutter costs it a column.
     *
     * The commands that take a **body** — `source`, `find`, `transform`,
     * `validate` — are the ones this is for: a multi-line plugin has no other
     * feedback on how many lines it is, and `mode: 'javascript'` highlighting
     * alone leaves a pasted body looking like one long line that happens to
     * wrap. `Input` derives it from the typed prefix and passes it down.
     */
    'lineNumbers'?: boolean;
    'onChange'(value: string): void;
    'onKeyDown'(event: KeyboardEvent<HTMLTextAreaElement>): void;
    'placeholder'?: string;
    'value': string;
}

/**
 * A controlled CodeMirror 6 editor that behaves like a `<textarea>`
 * for the surrounding Input component.
 *
 * Controlled in React terms: an outside `value` change (autocomplete
 * completion, history recall) is pushed into the editor with a dispatch that
 * preserves the cursor position.
 * The editor's own `updateListener` calls `onChange` back, and the echo
 * is swallowed by comparing against the last value seen.
 *
 * `mode: 'javascript'` is what highlights the typed `/source` body the
 * same way the thread's answer blocks are highlighted. `qword` owns the
 * language extension behind that option, so no `@codemirror/lang-*`
 * import is needed here.
 *
 * Key handling deliberately uses a native capture-phase `keydown`
 * listener instead of a CodeMirror `keymap` extension. `createEditor`
 * takes no `extensions` option — an extra key would be destructured
 * away and silently ignored — and reaching for `StateEffect.appendConfig`
 * would pull `@codemirror/state` into a package that does not declare
 * it. The container is an ancestor of the `.cm-content` CodeMirror
 * listens on, so capture runs first: the React `onKeyDown` (Input's
 * existing handler, unchanged) sees a synthetic event, and when it
 * calls `preventDefault` the real event is prevented *and* its
 * propagation stopped, so CodeMirror never acts on the key.
 */
export default function CodeMirrorBox({className, 'data-testid': testId, lineNumbers, onChange, onKeyDown, placeholder, value}: CodeMirrorBoxProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<QwordEditorView | null>(null);
    const lastValueRef = useRef(value);
    const rebuildRef = useRef(false);
    
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
                
                const next = getValue(editor);
                
                if (next === lastValueRef.current)
                    return;
                
                lastValueRef.current = next;
                onChangeRef.current(next);
            },
        });

        // `mode` is an option CodeMirror applies lazily — `createEditor`
        // passes it at construction, but the language extension is only
        // installed once `setOption` runs it. Without this, `/source` bodies
        // show line numbers but no colour. Same call `client/Editor.tsx`
        // makes after mount.
        setOption(editor, 'mode', 'javascript');

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
        
        // Sync the echo so the `value` effect sees the editor already holds
        
        // the right content and does not push it in again on the next tick.
        lastValueRef.current = value;
        
        if (rebuildRef.current && editorRef.current) {
            editorRef.current.focus();
            
            // A rebuild mounts with the cursor at 0. Restore it to the end of
            
            // the text instead — the rebuild fires because the user completed
            
            // a body command (`/sou` -> `/source ` flips `lineNumbers`), and
            
            // the caret belongs after what they typed, not before it.
            const restored = editor.state.doc.length;
            
            editor.dispatch({
                selection: {
                    anchor: restored,
                },
            });
        }
        
        rebuildRef.current = true;
        
        return () => {
            container.removeEventListener('keydown', onKey, true);
            editor.destroy();
            editorRef.current = null;
        };
    }, [lineNumbers]);
    
    /* c8 ignore end */
    useEffect(() => {
        if (!editorRef.current)
            return;
        
        if (value === lastValueRef.current)
            return;
        
        lastValueRef.current = value;
        
        const editor = editorRef.current;
        const {state} = editor;
        
        // The `value` prop comes from outside the box: autocomplete completion,
        // history recall, Escape clear. In every one of those cases the user's
        // next keystroke belongs at the END of the new text — typing appends,
        // and a recalled line is the whole line. Only the user's own keystrokes
        // (the `onChange` echo) keep the cursor where it was; that echo is
        // swallowed before this effect runs by `lastValueRef`, so it never
        // reaches here.
        //
        // `value.length` is the length of the new text the dispatch is about to
        // insert, which is where the caret belongs after it lands.
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
        
        // CodeMirror does not sync a selection to the DOM when it arrives in
        
        // the same transaction as a full-document replacement, leaving the
        
        // DOM cursor at 0 while the model says otherwise — and the next
        
        // keystroke lands at 0. Restore the caret after CodeMirror has laid
        
        // out the new text: a `queueMicrotask` fires before CodeMirror's own
        
        // frame-based selection sync, which then resets the DOM caret back to
        
        // 0, so only a `requestAnimationFrame` lands on top of it.
        requestAnimationFrame(() => {
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

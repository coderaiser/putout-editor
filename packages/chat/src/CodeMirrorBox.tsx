import {useEffect, useRef} from 'react';
import type {KeyboardEvent} from 'react';
import {
    createEditor,
    getValue,
    setValue,
    type QwordEditorView,
} from 'qword/client';

export interface CodeMirrorBoxProps {
    className?: string;
    'data-testid'?: string;
    onChange(value: string): void;
    onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void;
    placeholder?: string;
    value: string;
}

/**
 * A controlled CodeMirror 6 editor that behaves like a `<textarea>`
 * for the surrounding Input component.
 *
 * Controlled in React terms: an outside `value` change (autocomplete
 * completion, history recall) is pushed into the editor with `setValue`.
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
export default function CodeMirrorBox({
    className,
    'data-testid': testId,
    onChange,
    onKeyDown,
    placeholder,
    value,
}: CodeMirrorBoxProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<QwordEditorView | null>(null);
    const lastValueRef = useRef(value);
    
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    
    const onKeyDownRef = useRef(onKeyDown);
    onKeyDownRef.current = onKeyDown;
    
    useEffect(() => {
        const container = containerRef.current!;
        const editor = createEditor(container, {
            value,
            mode: 'javascript',
            lineNumbers: false,
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
        
        return () => {
            container.removeEventListener('keydown', onKey, true);
            editor.destroy();
            editorRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        /* c8 ignore next 2 */
        if (!editorRef.current)
            return;
        
        if (value === lastValueRef.current)
            return;
        
        lastValueRef.current = value;
        setValue(editorRef.current, value);
    }, [value]);
    
    return (
        <div
            className={[!value && 'input__box--empty', className].filter(Boolean).join(' ') || undefined}
            data-placeholder={placeholder}
            data-testid={testId}
            ref={containerRef}
        />
    );
}

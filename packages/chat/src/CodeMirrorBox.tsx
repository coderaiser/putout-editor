import './css/highlight.css';
import {
    useEffect,
    useLayoutEffect,
    useRef,
    type KeyboardEvent,
} from 'react';
import {
    createControlledEditor,
    type ControlledEditor,
} from './controlledEditor.ts';

export interface CodeMirrorBoxProps {
    'className'?: string;
    'data-testid'?: string;
    
    /**
     * The gutter. `Input` turns it on for a command with a body (`source`,
     * `find`, `transform`, `validate`) and off for a command name, which is one line.
     */
    'lineNumbers'?: boolean;
    'onChange'(value: string): void;
    'onKeyDown'(event: KeyboardEvent<HTMLTextAreaElement>): void;
    'placeholder'?: string;
    'value': string;
}

/**
 * A controlled CodeMirror 6 editor that acts like a `<textarea>`. The editor
 * itself is `createControlledEditor`, which has no React in it. This component
 * only ties it to a container, rebuilds it when `lineNumbers` changes, and
 * pushes an outside `value` into it.
 */
export default function CodeMirrorBox({className, 'data-testid': testId, lineNumbers, onChange, onKeyDown, placeholder, value}: CodeMirrorBoxProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<ControlledEditor | null>(null);
    const rebuildRef = useRef(false);
    
    const onChangeRef = useRef(onChange);
    const onKeyDownRef = useRef(onKeyDown);
    
    // Not in render: a ref is not written there. A layout effect runs before
    // the effect that builds the editor, so the editor always finds the latest.
    useLayoutEffect(() => {
        onChangeRef.current = onChange;
        onKeyDownRef.current = onKeyDown;
    });
    
    /*
     * CodeMirror has no setter for `lineNumbers`, so a change builds a new
     * editor: the cleanup destroys the old one and this runs again from the
     * current `value`. Only a rebuild takes the focus back: it fires when the
     * user completes a body command (`/sou` -> `/source ` flips `lineNumbers`)
     * mid-typing, and a first mount must not steal the focus.
     */
    useEffect(() => {
        const editor = createControlledEditor(containerRef.current!, {
            value,
            lineNumbers,
            focus: rebuildRef.current,
            onChange: (next) => onChangeRef.current(next),
            onKeyDown: (event) => onKeyDownRef.current(event as KeyboardEvent<HTMLTextAreaElement>),
        });
        
        editorRef.current = editor;
        rebuildRef.current = true;
        
        return () => {
            editor.destroy();
            editorRef.current = null;
        };
    }, [lineNumbers]);
    
    useEffect(() => {
        editorRef.current!.setValue(value);
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

import {useRef, useEffect} from 'react';
import type {Text} from '@codemirror/state';
import {
    createEditor,
    setValue,
    setOption,
    getValue,
    addLineClass,
    removeLineClass,
    markText,
    getCursorIndex,
    on,
    off,
    observeResize,
    type QwordEditorView,
    type CreateEditorOptions,
    type MarkHandle,
    type SourcePosition,
} from 'qword/client';
import {
    posFromIndex as adapterPosFromIndex,
    indexFromPos as adapterIndexFromPos,
} from './position.ts';

type UpdateListener =
    NonNullable<CreateEditorOptions['updateListener']> extends (update: infer U) => void
        ? U
        : never;
// Parser errors carry line information in various, parser-specific shapes
type ParseErrorLike = Error & {
    lineNumber?: number;
    line?: number;
    loc?: {
        line?: number;
    };
};

const returns = (a?: () => void) => () => a;
const getCMTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? /* c8 ignore next */'nord' : 'default';

const noop: () => void = returns();

interface EditorProps {
    value?: string;
    highlight?: boolean;
    lineNumbers?: boolean;
    readOnly?: boolean;
    mode?: string;
    keyMap?: string;
    error?: Error | null;
    highlightRange?: [
        number,
        number,
    ] | null;
    onContentChange?: (change: {
        value: string;
        cursor: number;
    }) => void;
    onActivity?: (cursor: number) => void;
    onBlur?: () => void;
    posFromIndex?: (doc: Text, index: number) => SourcePosition | null;
}

export default function Editor(props: EditorProps) {
    const {
        value = '',
        highlight = true,
        lineNumbers = true,
        readOnly = false,
        mode = 'javascript',
        keyMap = 'default',
        error = null,
        highlightRange = null,
        onContentChange = noop,
        onActivity = noop,
        onBlur = noop,
        posFromIndex: posFromIndexProp,
    } = props;
    
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<QwordEditorView | null>(null);
    const valueRef = useRef(value);
    const errorRef = useRef(error);
    const markRef = useRef<MarkHandle | null>(null);
    
    const markerRangeRef = useRef<[
        number,
        number,
    ] | null>(null);
    
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const activityRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const programmaticSelectionRef = useRef(false);
    
    useEffect(() => {
        const editor = createEditor(containerRef.current!, {
            keyMap: keyMap as CreateEditorOptions['keyMap'],
            value,
            mode,
            lineNumbers,
            readOnly,
            theme: getCMTheme(),
            updateListener: (update: UpdateListener) => {
                if (update.docChanged) {
                    clearTimeout(timerRef.current);
                    timerRef.current = setTimeout(() => {
                        const currentValue = getValue(editor);
                        const cursorIndex = getCursorIndex(editor);
                        
                        valueRef.current = currentValue;
                        onContentChange({
                            value: currentValue,
                            cursor: cursorIndex,
                        });
                    }, 200);
                    
                    return;
                }
                
                if (update.selectionSet) {
                    /* c8 ignore start */
                    if (programmaticSelectionRef.current) {
                        programmaticSelectionRef.current = false;
                        return;
                    }
                    
                    /* c8 ignore end */
                    clearTimeout(activityRef.current);
                    activityRef.current = setTimeout(() => {
                        onActivity(getCursorIndex(editor));
                    }, 50);
                }
            },
        });
        
        editorRef.current = editor;
        
        const themeObserver = new MutationObserver(() => {
            /* c8 ignore next */
            setOption(editor, 'theme', getCMTheme());
        });
        
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        
        const cleanupResize = observeResize(editor, containerRef.current!);
        const [blurEv, blurFn] = on(editor, 'blur', onBlur);
        
        return () => {
            clearTimeout(timerRef.current);
            off(editor, blurEv, blurFn);
            themeObserver.disconnect();
            cleanupResize();
            editor.destroy();
            editorRef.current = null;
        };
    }, []);
    
    useEffect(() => {
        if (editorRef.current && value !== valueRef.current) {
            valueRef.current = value;
            setValue(editorRef.current, value);
        }
    }, [value]);
    
    useEffect(() => {
        if (editorRef.current)
            setOption(editorRef.current, 'mode', mode);
    }, [mode]);
    
    useEffect(() => {
        if (editorRef.current)
            setOption(editorRef.current, 'keyMap', keyMap);
    }, [keyMap]);
    
    useEffect(() => {
        const editor = editorRef.current;
        const getLine = (error: ParseErrorLike | null) => error && (error.lineNumber || error.line || error.loc?.line);
        
        const oldLine = getLine(errorRef.current);
        
        if (editor && oldLine)
            removeLineClass(editor, oldLine - 1, 'text', 'errorMarker');
        
        const newLine = getLine(error);
        
        if (editor && newLine)
            addLineClass(editor, newLine - 1, 'text', 'errorMarker');
        
        errorRef.current = error;
    }, [error]);
    
    useEffect(() => {
        const editor = editorRef.current;
        
        if (!editor || !highlight)
            return;
        
        if (markRef.current) {
            markRef.current.clear();
            markRef.current = null;
            markerRangeRef.current = null;
        }
        
        if (!highlightRange)
            return;
        
        markerRangeRef.current = highlightRange;
        
        const resolve = posFromIndexProp ? (idx: number) => posFromIndexProp(editor.state.doc, idx) : (idx: number) => adapterPosFromIndex(editor, idx);
        
        const [start, end] = highlightRange.map(resolve);
        
        if (!start || !end) {
            markerRangeRef.current = null;
            return;
        }
        
        markRef.current = markText(editor, start, end, {
            className: 'marked',
        });
    }, [highlightRange, highlight, posFromIndexProp]);
    
    /* c8 ignore start */
    useEffect(() => {
        const editor = editorRef.current;
        
        if (!editor || !highlightRange)
            return;
        
        const resolve = (idx: number) => {
            if (posFromIndexProp) {
                const result = posFromIndexProp(editor.state.doc, idx);
                
                if (result)
                    return result;
            }
            
            return adapterPosFromIndex(editor, idx);
        };
        
        const toOffset = (pos: SourcePosition | null) => {
            if (!pos)
                return null;
            
            return adapterIndexFromPos(editor, pos);
        };
        
        const [start, end] = highlightRange.map(resolve);
        
        if (start && end) {
            const startOffset = toOffset(start);
            const endOffset = toOffset(end);
            
            if (startOffset !== null && endOffset !== null) {
                programmaticSelectionRef.current = true;
                
                editor.dispatch({
                    selection: {
                        anchor: startOffset,
                        head: endOffset,
                    },
                    scrollIntoView: true,
                });
            }
        }
    }, [highlightRange, posFromIndexProp]);
    
    /* c8 ignore end */
    return (
        <div className="editor" ref={containerRef}/>
    );
}

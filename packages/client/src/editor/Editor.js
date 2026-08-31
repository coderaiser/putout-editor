import {useRef, useEffect} from 'react';
import {
    createEditor,
    setValue,
    setOption,
    getValue,
    addLineClass,
    removeLineClass,
    markText,
    posFromIndex as adapterPosFromIndex,
    getCursorIndex,
    on,
    off,
    observeResize,
} from './codemirror/index.js';

const returns = (a) => () => a;
const getCMTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'nord' : 'default';

const noop = returns();

export default function Editor(props) {
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
    
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const valueRef = useRef(value);
    const errorRef = useRef(error);
    const markRef = useRef(null);
    const markerRangeRef = useRef(null);
    const timerRef = useRef(null);
    const activityRef = useRef(null);
    
    useEffect(() => {
        const editor = createEditor(containerRef.current, {
            keyMap,
            value,
            mode,
            lineNumbers,
            readOnly,
            theme: getCMTheme(),
            updateListener: (update) => {
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
                    clearTimeout(activityRef.current);
                    activityRef.current = setTimeout(() => {
                        onActivity(getCursorIndex(editor));
                    }, 50);
                }
            },
        });
        
        editorRef.current = editor;
        
        const themeObserver = new MutationObserver(() => {
            setOption(editor, 'theme', getCMTheme());
        });
        
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        
        const cleanupResize = observeResize(editor, containerRef.current);
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
        const getLine = (error) => error && (error.lineNumber || error.line || error.loc?.line);
        
        const oldLine = getLine(errorRef.current);
        
        if (oldLine)
            removeLineClass(editor, oldLine - 1, 'text', 'errorMarker');
        
        const newLine = getLine(error);
        
        if (newLine)
            addLineClass(editor, newLine - 1, 'text', 'errorMarker');
        
        errorRef.current = error;
    }, [error]);
    
    // Sync highlightRange prop — replaces HIGHLIGHT/CLEAR_HIGHLIGHT pubsub
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
        
        const resolve = posFromIndexProp ? (idx) => posFromIndexProp(editor.state.doc, idx) : (idx) => adapterPosFromIndex(editor, idx);
        
        const [start, end] = highlightRange.map(resolve);
        
        if (!start || !end) {
            markerRangeRef.current = null;
            return;
        }
        
        markRef.current = markText(editor, start, end, {
            className: 'marked',
        });
    }, [highlightRange, highlight, posFromIndexProp]);
    
    return (
        <div className="editor" ref={containerRef}/>
    );
}


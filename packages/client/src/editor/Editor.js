import {useRef, useEffect} from 'react';
import {StateEffect} from '@codemirror/state';
import {highlightActiveLine} from '@codemirror/view';
import {
    createEditor,
    setOption,
    getValue,
    addLineClass,
    removeLineClass,
    markText,
    getCursorIndex,
    on,
    off,
    observeResize,
} from 'qword/client';
import {
    posFromIndex as adapterPosFromIndex,
    indexFromPos as adapterIndexFromPos,
} from './position.js';
import {getDocChanges} from './changes.ts';

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
        onKeyDown = noop,
        autoFocus = false,
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
    const programmaticSelectionRef = useRef(false);
    
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
                    // Skip onActivity when selection is set programmatically
                    if (programmaticSelectionRef.current) {
                        programmaticSelectionRef.current = false;
                        return;
                    }
                    
                    clearTimeout(activityRef.current);
                    activityRef.current = setTimeout(() => {
                        onActivity(getCursorIndex(editor));
                    }, 50);
                }
            },
        });
        
        editorRef.current = editor;
        
        editor.dispatch({
            effects: StateEffect.appendConfig.of(highlightActiveLine()),
        });
        
        if (autoFocus)
            editor.focus();
        
        const themeObserver = new MutationObserver(() => {
            setOption(editor, 'theme', getCMTheme());
        });
        
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        
        const handleKeyDown = (event) => {
            // Flush the debounced content change so the store is fresh
            // when the keydown formatting runs.
            clearTimeout(timerRef.current);
            
            const currentValue = getValue(editor);
            const cursor = getCursorIndex(editor);
            
            valueRef.current = currentValue;
            onContentChange({
                value: currentValue,
                cursor,
            });
            
            // Do not reformat while typing printable characters,
            // only when editing pauses (Escape, arrows, Enter...).
            /* c8 ignore start */
            if (event.key.length === 1) {
                return;
            }
            /* c8 ignore stop */
            
            onKeyDown(event);
        };
        
        const cleanupResize = observeResize(editor, containerRef.current);
        const [keyDownEv, keyDownFn] = on(editor, 'keydown', handleKeyDown);
        
        return () => {
            clearTimeout(timerRef.current);
            off(editor, keyDownEv, keyDownFn);
            themeObserver.disconnect();
            cleanupResize();
            editor.destroy();
            editorRef.current = null;
        };
    }, []);
    
    useEffect(() => {
        const changes = getDocChanges(valueRef.current, value);
        
        if (!changes)
            return;
        
        valueRef.current = value;
        editorRef.current.dispatch({changes});
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
    
    useEffect(() => {
        const editor = editorRef.current;
        
        if (!editor || !highlightRange)
            return;
        
        const resolve = (idx) => {
            if (posFromIndexProp) {
                const result = posFromIndexProp(editor.state.doc, idx);
                
                if (result)
                    return result;
            }
            
            return adapterPosFromIndex(editor, idx);
        };
        
        const toOffset = (pos) => {
            if (!pos)
                /* c8 ignore next */
                return null;
            
            return adapterIndexFromPos(editor, pos);
        };
        
        const [start, end] = highlightRange.map(resolve);
        
        if (start && end) {
            const startOffset = toOffset(start);
            const endOffset = toOffset(end);
            
            if (startOffset !== null && endOffset !== null) {
                // Mark this as programmatic selection to prevent feedback loop
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
    
    return (
        <div className="editor" ref={containerRef}/>
    );
}

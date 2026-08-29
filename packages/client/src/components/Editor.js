import {useRef, useEffect, useCallback} from 'react';
import {
    createEditor, setValue, setOption,
    addLineClass, removeLineClass, markText,
    posFromIndex as adapterPosFromIndex,
    getCursorIndex, getDocValue, setDocValue,
    getMaxLineLength, on, off, observeResize,
} from '../editor/codemirror-adapter.js';

const getCMTheme = () =>
    document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'nord'
        : 'default';

const defaultPrettierOptions = {
    printWidth:         80,
    tabWidth:           4,
    singleQuote:        true,
    bracketSpacing:     false,
    jsxBracketSameLine: false,
    parser:             'babel',
    trailingComma:      'es5',
    arrowParens:        'always',
};

const noop = () => {};

export default function Editor({
    value            = '',
    highlight        = true,
    lineNumbers      = true,
    readOnly         = false,
    mode             = 'javascript',
    keyMap           = 'default',
    error            = null,
    enableFormatting = false,
    highlightRange   = null,
    onContentChange  = noop,
    onActivity       = noop,
    posFromIndex:    posFromIndexProp,
}) {
    const containerRef   = useRef(null);
    const editorRef      = useRef(null);
    const valueRef       = useRef(value);
    const errorRef       = useRef(error);
    const markRef        = useRef(null);
    const markerRangeRef = useRef(null);
    const timerRef       = useRef(null);
    
    // Mount — create CodeMirror instance, bind all handlers
    useEffect(() => {
        const editor = createEditor(containerRef.current, {
            keyMap, value, mode, lineNumbers, readOnly,
            indentUnit: 4,
            theme: getCMTheme(),
        });
        editorRef.current = editor;
        
        // Theme — watch data-theme attribute on <html>
        const themeObserver = new MutationObserver(() => {
            setOption(editor, 'theme', getCMTheme());
        });
        
        themeObserver.observe(document.documentElement, {
            attributes:      true,
            attributeFilter: ['data-theme'],
        });
        
        // Resize — replaces PANEL_RESIZE pubsub subscription
        const cleanupResize = observeResize(editor, containerRef.current);
        
        // Blur → prettier format on save
        const [blurEv, blurFn] = on(editor, 'blur', (instance) => {
            if (!enableFormatting)
                return;
            
            Promise
                .all([
                    import('prettier/standalone'),
                    import('prettier/parser-babel'),
                ])
                .then(([prettierMod, babelMod]) => {
                    const prettier  = prettierMod.default || prettierMod;
                    const babel     = babelMod.default || babelMod;
                    const currValue = getDocValue(instance);
                    
                    const options = {
                        ...defaultPrettierOptions,
                        printWidth: getMaxLineLength(instance),
                        plugins:    [babel],
                    };
                    
                    setDocValue(instance, prettier.format(currValue, options));
                });
        });
        
        // Changes → debounced content update
        const [changesEv, changesFn] = on(editor, 'changes', () => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                const doc  = editor.getDoc();
                const args = {
                    value:  doc.getValue(),
                    cursor: doc.indexFromPos(doc.getCursor()),
                };
                
                valueRef.current = args.value;
                onContentChange(args);
            }, 200);
        });
        
        // Cursor activity → debounced cursor position update
        const [cursorEv, cursorFn] = on(editor, 'cursorActivity', () => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                onActivity(getCursorIndex(editor));
            }, 100);
        });
        
        return () => {
            clearTimeout(timerRef.current);
            off(editor, blurEv, blurFn);
            off(editor, changesEv, changesFn);
            off(editor, cursorEv, cursorFn);
            themeObserver.disconnect();
            cleanupResize();
            
            if (containerRef.current?.children[0])
                containerRef.current.removeChild(containerRef.current.children[0]);
            
            editorRef.current = null;
        };
    // Mount only — prop changes handled by separate effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Sync value prop
    useEffect(() => {
        if (editorRef.current && value !== valueRef.current) {
            valueRef.current = value;
            setValue(editorRef.current, value);
        }
    }, [value]);
    
    // Sync mode prop
    useEffect(() => {
        if (editorRef.current)
            setOption(editorRef.current, 'mode', mode);
    }, [mode]);
    
    // Sync keyMap prop
    useEffect(() => {
        if (editorRef.current)
            setOption(editorRef.current, 'keyMap', keyMap);
    }, [keyMap]);
    
    // Sync error prop — add/remove error line class
    useEffect(() => {
        const editor = editorRef.current;
        
        if (!editor)
            return;
        
        const getLine = (err) =>
            err?.loc?.line ?? err?.lineNumber ?? err?.line ?? null;
        
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
        
        const resolve = posFromIndexProp
            ? (idx) => posFromIndexProp(editor.getDoc(), idx)
            : (idx) => adapterPosFromIndex(editor, idx);
        
        const [start, end] = highlightRange.map(resolve);
        
        if (!start || !end) {
            markerRangeRef.current = null;
            return;
        }
        
        markRef.current = markText(editor, start, end, {className: 'marked'});
    }, [highlightRange, highlight, posFromIndexProp]);
    
    return <div className="editor" ref={containerRef}/>
}

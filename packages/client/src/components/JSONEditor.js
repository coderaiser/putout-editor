import {useRef, useEffect} from 'react';
import {
    createEditor, setValue, getScrollInfo, scrollTo, observeResize,
} from '../editor/codemirror-adapter.js';

export default function JSONEditor({value = '', className = ''}) {
    const containerRef = useRef(null);
    const editorRef    = useRef(null);
    
    useEffect(() => {
        const editor = createEditor(containerRef.current, {
            value,
            mode:        {name: 'javascript', json: true},
            readOnly:    true,
            lineNumbers: true,
            foldGutter:  true,
            gutters:     ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        });
        editorRef.current = editor;
        const cleanupResize = observeResize(editor, containerRef.current);
        return () => {
            cleanupResize();
            editorRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || value === editor.getValue()) return;
        const info = getScrollInfo(editor);
        setValue(editor, value);
        scrollTo(editor, info.left, info.top);
    }, [value]);
    
    return <div id="JSONEditor" className={className} ref={containerRef}/>;
}

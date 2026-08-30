import {useRef, useEffect} from 'react';
import {
    createEditor,
    setValue,
    getValue,
    getScrollInfo,
    scrollTo,
    observeResize,
} from '../editor/codemirror-adapter/index.js';

export default function JSONEditor({value = '', className = ''}) {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    
    useEffect(() => {
        const editor = createEditor(containerRef.current, {
            value,
            mode: {
                name: 'javascript',
                json: true,
            },
            readOnly: true,
            lineNumbers: true,
            foldGutter: true,
        });
        
        editorRef.current = editor;
        const cleanupResize = observeResize(editor, containerRef.current);
        
        return () => {
            cleanupResize();
            editor.destroy();
            editorRef.current = null;
        };
    }, []);
    
    useEffect(() => {
        const editor = editorRef.current;
        
        if (!editor || value === getValue(editor))
            return;
        
        const info = getScrollInfo(editor);
        setValue(editor, value);
        scrollTo(editor, info.left, info.top);
    }, [value]);
    
    return (
        <div id="JSONEditor" className={className} ref={containerRef}/>
    );
}

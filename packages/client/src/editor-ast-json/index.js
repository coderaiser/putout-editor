import PropTypes from 'prop-types';
import {useRef, useEffect} from 'react';
import {
    stringify,
    createEditor,
    setValue,
    getValue,
    getScrollInfo,
    scrollTo,
    observeResize,
} from '#editor';

export default function EditorASTJson({value = '', parseResult = null, className = ''}) {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    
    const resolvedValue = parseResult
        ? stringify(parseResult.ast, null, 4)
        : value;
    
    useEffect(() => {
        const editor = createEditor(containerRef.current, {
            value: resolvedValue,
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
        
        if (!editor || resolvedValue === getValue(editor))
            return;
        
        const info = getScrollInfo(editor);
        setValue(editor, resolvedValue);
        scrollTo(editor, info.left, info.top);
    }, [resolvedValue]);
    
    return (
        <div id="EditorASTJson" className={className} ref={containerRef}/>
    );
}

EditorASTJson.propTypes = {
    value: PropTypes.string,
    parseResult: PropTypes.object,
    className: PropTypes.string,
};

import {useRef, useEffect} from 'react';
import type {ParseResult} from '#store';
import {
    createEditor,
    setValue,
    getValue,
    getScrollInfo,
    scrollTo,
    observeResize,
    setOption,
} from '#editor';

const getCMTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'nord' : 'default';

interface EditorASTJsonProps {
    value?: string;
    parseResult?: ParseResult;
    className?: string;
}

export default function EditorASTJson({value = '', parseResult = null, className = ''}: EditorASTJsonProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<any>(null);
    
    const resolvedValue = parseResult
        ? JSON.stringify(parseResult.ast, null, 4)
        : value;
    
    useEffect(() => {
        const editor = createEditor(containerRef.current!, {
            value: resolvedValue,
            mode: {
                name: 'javascript',
                json: true,
            },
            readOnly: true,
            lineNumbers: true,
            foldGutter: true,
            theme: getCMTheme(),
        });
        
        const themeObserver = new MutationObserver(() => {
            setOption(editor, 'theme', getCMTheme());
        });
        
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        
        editorRef.current = editor;
        const cleanupResize = observeResize(editor, containerRef.current!);
        
        return () => {
            themeObserver.disconnect();
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
        <div id="EditorASTJson" className={`container ${className}`.trim()} ref={containerRef}/>
    );
}

EditorASTJson.displayName = 'JSON';

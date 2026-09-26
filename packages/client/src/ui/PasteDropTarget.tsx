import './PasteDropTarget.css';
import {useDispatch} from 'react-redux';
import {tryCatch} from 'try-catch';
import {print} from '@putout/engine-parser';
import {
    useState,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';
import {setError, dropText} from '#store';
import {categories} from '#parser';

const noop = () => {};

const editableNodeNames = new Set([
    'INPUT',
    'TEXTAREA',
]);

/**
 * `PasteDropTarget` listens for `paste` on `document` in the capture phase, so
 * it sees every paste in the app — including the ones aimed at a text field or
 * at a CodeMirror editor. Those belong to the field: hijacking them both throws
 * the clipboard away and overwrites `workbench.code` with whatever the user was
 * editing somewhere else entirely.
 */
const isEditableTarget = (target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    
    if (!element)
        return false;
    
    if (editableNodeNames.has(element.nodeName))
        return true;
    
    // CodeMirror marks its content as contenteditable
    return Boolean(element.closest?.('[contenteditable="true"]'));
};

const acceptedFileTypes = new Map([
    ['application/json', 'JSON'],
    ['text/plain', 'TEXT'],
]);

for (const {id, mimeTypes} of categories)
    for (const mimeType of mimeTypes)
        acceptedFileTypes.set(mimeType, id);

function jsonToCode(json: string): Promise<string> {
    const [parseError, parsedAst] = tryCatch(JSON.parse, json);
    
    if (parseError)
        return Promise.resolve(json);
    
    const [printError, code] = tryCatch(print, parsedAst);
    
    if (printError)
        return Promise.reject(printError);
    
    return Promise.resolve(code);
}

type PasteDropTargetProps = {
    children?: ReactNode;
} & Record<string, unknown>;
type RemoveListener = () => void;

export default function PasteDropTarget({children, ...props}: PasteDropTargetProps) {
    const dispatch = useDispatch();
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    
    function onText(action: string, code: string) {
        dispatch(dropText({
            text: code,
            categoryId: 'javascript',
        }));
    }
    
    function onError(error: unknown) {
        dispatch(setError(error));
    }
    
    function handleASTError(exception: unknown) {
        onError(`Cannot process pasted AST: ${(exception as Error).message}`);
    }
    
    useEffect(() => {
        const removeListeners: RemoveListener[] = [];
        const container = containerRef.current;
        
        function bindListener(element: Document | HTMLElement, eventName: string, listener: EventListener, capture?: boolean) {
            for (const singleEvent of eventName.split(/\s+/)) {
                element.addEventListener(singleEvent, listener, capture);
                removeListeners.push(() => element.removeEventListener(singleEvent, listener, capture));
            }
        }
        
        // This listener is on `document` in the capture phase, so it sees *every*
        // paste in the app — including ones aimed at an `<input>`, a `<textarea>` or
        // a CodeMirror editor. Hijacking those both discards the clipboard and
        // overwrites `workbench.code` with whatever the user was editing elsewhere,
        // so the guard below hands those back to the field. The feature is "paste
        // code anywhere that is not a text field, to load it as the snippet".
        bindListener(document, 'paste', (event) => {
            const clipboardEvent = event as ClipboardEvent;
            
            // A paste aimed at a text field or an editor is that field's own
            // business — leave the default handling alone.
            if (isEditableTarget(clipboardEvent.target))
                return;
            
            if (!clipboardEvent.clipboardData)
                return;
            
            const {clipboardData} = clipboardEvent;
            
            if (!clipboardData.types.indexOf || clipboardData.types.indexOf('text/plain') <= -1)
                return;
            
            clipboardEvent.stopPropagation();
            clipboardEvent.preventDefault();
            
            jsonToCode(clipboardData.getData('text/plain'))
                .then((code) => onText('paste', code))
                .catch(() => handleASTError('paste'));
        }, true);
        
        let dragTimer: ReturnType<typeof setTimeout> | undefined;
        
        bindListener(container!, 'dragenter', (event) => {
            clearTimeout(dragTimer);
            event.preventDefault();
            setDragging(true);
        }, true);
        
        bindListener(container!, 'dragover', (event) => {
            clearTimeout(dragTimer);
            event.preventDefault();
            (event as DragEvent).dataTransfer!.dropEffect = 'copy';
        }, true);
        
        bindListener(container!, 'drop', (event) => {
            const dragEvent = event as DragEvent;
            setDragging(false);
            
            const [file] = dragEvent.dataTransfer!.files;
            let categoryId: string | undefined = acceptedFileTypes.get(file.type);
            
            if (!categoryId || !onText)
                return;
            
            dragEvent.preventDefault();
            dragEvent.stopPropagation();
            
            const reader = new FileReader();
            
            reader.onload = (readerEvent) => {
                let text: string | Promise<string | null> | null = (readerEvent.target as FileReader).result as string;
                
                if (categoryId === 'JSON' || categoryId === 'TEXT')
                    text = jsonToCode(text as string)
                        .then((code) => {
                            categoryId = 'javascript';
                            return code;
                        })
                        .catch(() => {
                            if (categoryId === 'JSON')
                                handleASTError('drop');
                            
                            return null;
                        });
                
                Promise
                    .resolve(text)
                    .then((code) => {
                        if (!code)
                            return;
                        
                        onText('drop', code);
                    })
                    .catch(noop);
            };
            
            reader.readAsText(file);
        }, true);
        
        bindListener(container!, 'dragleave', () => {
            clearTimeout(dragTimer);
            dragTimer = setTimeout(() => setDragging(false), 50);
        }, true);
        
        return () => {
            for (const removeListener of removeListeners)
                removeListener();
        };
    }, []);
    
    return (
        <div
            ref={containerRef}
            {...(props as Record<string, unknown>)}
        >
            {dragging && (
                <div className="dropIndicator">
                    <div>Drop the code or (JSON-encoded) AST file here</div>
                </div>
            )}
            {children}
        </div>
    );
}

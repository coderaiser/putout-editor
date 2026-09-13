import {useDispatch} from 'react-redux';
import {tryCatch} from 'try-catch';
import {
    useState,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';
import {setError, dropText} from '#store';
import {categories} from '#parser';

type Escodegen = {
    generate: (ast: unknown, options?: unknown) => string;
};

const noop = () => {};

async function importEscodegen(): Promise<Escodegen> {
    const escodegen = await import('escodegen') as Escodegen & {
        default?: Escodegen;
    };
    
    return escodegen.default || escodegen;
}

const acceptedFileTypes = new Map([
    ['application/json', 'JSON'],
    ['text/plain', 'TEXT'],
]);

for (const {id, mimeTypes} of categories)
    for (const mimeType of mimeTypes)
        acceptedFileTypes.set(mimeType, id);

function jsonToCode(json: string): Promise<string> {
    const [error, parsedAst] = tryCatch(JSON.parse, json);
    
    if (error)
        return Promise.resolve(json);
    
    return importEscodegen().then((escodegen) => escodegen.generate(parsedAst, {
        format: {
            indent: {
                style: '    ',
            },
        },
    }));
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
        
        bindListener(document, 'paste', (event) => {
            const clipboardEvent = event as ClipboardEvent;
            
            if (!clipboardEvent.clipboardData)
                return;
            
            const {clipboardData} = clipboardEvent;
            
            if (!clipboardData.types.indexOf || clipboardData.types.indexOf('text/plain') <= -1)
                return;
            
            clipboardEvent.stopPropagation();
            clipboardEvent.preventDefault();
            
            jsonToCode(clipboardData.getData('text/plain'))
                .then((code) => onText('paste', code))
                .catch(() => {
                    if ((clipboardEvent.target as HTMLElement)?.nodeName !== 'TEXTAREA')
                        handleASTError('paste');
                });
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

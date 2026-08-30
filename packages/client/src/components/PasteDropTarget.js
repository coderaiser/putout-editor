import {useState, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import {categories} from '../parsers/index.js';

const noop = () => {};

function importEscodegen() {
    return import('escodegen').then((module_) => module_.default || module_);
}

const acceptedFileTypes = new Map([
    ['application/json', 'JSON'],
    ['text/plain', 'TEXT'],
]);

for (const {id, mimeTypes} of categories)
    for (const mimeType of mimeTypes)
        acceptedFileTypes.set(mimeType, id);

function jsonToCode(json) {
    let parsedAst;
    
    try {
        parsedAst = JSON.parse(json);
    } catch {
        return Promise.resolve(json);
    }
    
    return importEscodegen().then((escodegen) =>
        escodegen.generate(parsedAst, {format: {indent: {style: '    '}}}));
}

export default function PasteDropTarget({onText, onError, children, ...props}) {
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef(null);
    
    function handleASTError(type, event, exception) {
        onError(type, event, `Cannot process pasted AST: ${exception.message}`);
    }
    
    useEffect(() => {
        const removeListeners = [];
        const container = containerRef.current;
        
        function bindListener(element, eventName, listener, capture) {
            for (const singleEvent of eventName.split(/\s+/)) {
                element.addEventListener(singleEvent, listener, capture);
                removeListeners.push(() =>
                    element.removeEventListener(singleEvent, listener, capture));
            }
        }
        
        bindListener(document, 'paste', (event) => {
            if (!event.clipboardData)
                return;
            
            const clipboardData = event.clipboardData;
            
            if (!clipboardData.types.indexOf ||
                !clipboardData.types.indexOf('text/plain') > -1)
                return;
            
            event.stopPropagation();
            event.preventDefault();
            
            jsonToCode(clipboardData.getData('text/plain'))
                .then((code) => onText('paste', event, code))
                .catch((exception) => {
                    if (event.target.nodeName !== 'TEXTAREA')
                        handleASTError('paste', event, exception);
                });
        }, true);
        
        let dragTimer;
        
        bindListener(container, 'dragenter', (event) => {
            clearTimeout(dragTimer);
            event.preventDefault();
            setDragging(true);
        }, true);
        
        bindListener(container, 'dragover', (event) => {
            clearTimeout(dragTimer);
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        }, true);
        
        bindListener(container, 'drop', (event) => {
            setDragging(false);
            
            const [file] = event.dataTransfer.files;
            let categoryId = acceptedFileTypes.get(file.type);
            
            if (!categoryId || !onText)
                return;
            
            event.preventDefault();
            event.stopPropagation();
            
            const reader = new FileReader();
            
            reader.onload = (readerEvent) => {
                let text = readerEvent.target.result;
                
                if (categoryId === 'JSON' || categoryId === 'TEXT') {
                    text = jsonToCode(text)
                        .then((code) => {
                            categoryId = 'javascript';
                            return code;
                        })
                        .catch((exception) => {
                            if (categoryId === 'JSON')
                                handleASTError('drop', readerEvent, exception);
                            
                            return null;
                        });
                }
                
                Promise.resolve(text)
                    .then((code) => {
                        if (!code)
                            return;
                        
                        onText('drop', readerEvent, code, categoryId);
                    })
                    .catch(noop);
            };
            
            reader.readAsText(file);
        }, true);
        
        bindListener(container, 'dragleave', () => {
            clearTimeout(dragTimer);
            dragTimer = setTimeout(() => setDragging(false), 50);
        }, true);
        
        return () => {
            for (const removeListener of removeListeners)
                removeListener();
        };
    }, []);
    
    return (
        <div ref={containerRef} {...props}>
            {dragging && (
                <div className="dropIndicator">
                    <div>Drop the code or (JSON-encoded) AST file here</div>
                </div>
            )}
            {children}
        </div>
    );
}

PasteDropTarget.propTypes = {
    onText: PropTypes.func,
    onError: PropTypes.func,
    children: PropTypes.node,
};

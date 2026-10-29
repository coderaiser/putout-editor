/**
 * The text of each element that matches `selector`, in document order.
 * Do not call a method detached from its element: happy-dom needs `this`.
 */
export const textsOf = (selector: string): string[] => {
    const result: string[] = [];
    
    for (const element of document.querySelectorAll(selector))
        result.push(element.textContent || '');
    
    return result;
};

/**
 * Run `fn` with `selectionchange` deferred, as a browser does. happy-dom
 * dispatches it inside `Selection.collapse`, so CodeMirror updates during an
 * update and throws. The patch is undone after `fn`; no event is lost.
 */
export const withAsyncSelectionChange = <T>(fn: () => T): T => {
    const original = document.dispatchEvent;
    
    document.dispatchEvent = function(event: Event) {
        if (event.type !== 'selectionchange')
            return original.call(this, event);
        
        queueMicrotask(() => {
            original.call(this, event);
        });
        
        return true;
    };
    
    try {
        return fn();
    } finally {
        document.dispatchEvent = original;
    }
};

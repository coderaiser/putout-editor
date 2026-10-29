/**
 * The texts of every element matching `selector`, in document order.
 *
 * `Array.from(nodeList).map((element) => element.textContent)` rather than
 * `[...nodeList].map(({textContent}) => textContent)`: pulling a method off an
 * element and calling it detached loses `this`, which happy-dom's
 * `getAttribute` needs. Every spec that reads the DOM goes through here so the
 * trap is in one place.
 */
export const textsOf = (selector: string): string[] => {
    const result: string[] = [];
    
    for (const element of document.querySelectorAll(selector))
        result.push(element.textContent || '');
    
    return result;
};

/**
 * Run `fn` with `selectionchange` delivered the way a browser delivers it: later.
 *
 * happy-dom dispatches `selectionchange` from inside `Selection.collapse`, so
 * when CodeMirror syncs its selection to the DOM in the middle of an update,
 * the event re-enters CodeMirror's own `DOMObserver` and it calls
 * `view.update` while one is running — "Calls to EditorView.update are not
 * allowed while an update is in progress". A browser queues that event, so the
 * error exists only here and says nothing about the app.
 *
 * Around the call rather than for the file: the specs share one happy-dom
 * window, so a patch left behind would change every spec that runs after it.
 * The deferred events go through the original `dispatchEvent`, so nothing is
 * dropped — it only arrives after `fn` has returned.
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

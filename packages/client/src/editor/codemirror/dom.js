import {EditorView} from '@codemirror/view';

export function getView(container) {
    const element = container.querySelector('.cm-editor');
    return element ? EditorView.findFromDOM(element) : null;
}

export function refresh(view) {
    view.requestMeasure();
}

export function observeResize(view, container) {
    const observer = new ResizeObserver(() => view.requestMeasure());
    observer.observe(container);
    
    return () => observer.disconnect();
}

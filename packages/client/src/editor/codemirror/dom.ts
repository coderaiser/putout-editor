import {EditorView} from '@codemirror/view';

export function getView(container: HTMLElement): EditorView | null {
    const element = container.querySelector('.cm-editor');

        return element ? EditorView.findFromDOM(element as HTMLElement) : null;
}

export function refresh(view: EditorView): void {
    view.requestMeasure();
}

export function observeResize(view: EditorView, container: Element): () => void {
    const observer = new ResizeObserver(() => view.requestMeasure());
    observer.observe(container);

    return () => observer.disconnect();
}
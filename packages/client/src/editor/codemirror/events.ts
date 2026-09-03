import type {EditorView} from '@codemirror/view';

export type EventBinding = [string, EventListener];

export function on(view: EditorView, event: string, handler: EventListener): EventBinding {
    view.contentDOM.addEventListener(event, handler);
    
    return [event, handler];
}

export function off(view: EditorView, event: string, handler: EventListener): void {
    view.contentDOM.removeEventListener(event, handler);
}

import type {EditorView} from '@codemirror/view';

export type ScrollInfo = {
    left: number;
    top: number;
};

export const getScrollInfo = (view: EditorView): ScrollInfo => ({
    left: view.scrollDOM.scrollLeft,
    top: view.scrollDOM.scrollTop,
});

export function scrollTo(view: EditorView, left: number, top: number): void {
    view.scrollDOM.scrollLeft = left;
    view.scrollDOM.scrollTop = top;
}
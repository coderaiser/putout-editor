import type {EditorView} from '@codemirror/view';
import type {CharOffset, SourcePosition} from '../../types.ts';

export function offsetToPosition(
    document_: EditorView['state']['doc'],
    offset: CharOffset,
): SourcePosition {
    const index = offset < 0 ? 0 : offset > document_.length ? document_.length : offset;
    const line = document_.lineAt(index);

    return {
        line: line.number - 1,
        ch: index - line.from,
    };
}

export function positionToOffset(
    document_: EditorView['state']['doc'],
    {line, ch}: SourcePosition,
): CharOffset {
    return document_.line(line + 1).from + ch;
}

export function posFromIndex(view: EditorView, index: CharOffset): SourcePosition {
    return offsetToPosition(view.state.doc, index);
}

export function indexFromPos(view: EditorView, position: SourcePosition): CharOffset {
    return positionToOffset(view.state.doc, position);
}

export const getCursorIndex = (view: EditorView): CharOffset =>
    view.state.selection.main.head;
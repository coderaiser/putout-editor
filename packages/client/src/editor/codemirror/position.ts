import type {EditorView} from '@codemirror/view';
import type {CharOffset, SourcePosition} from '../../types.ts';

export function offsetToPosition(document_: EditorView['state']['doc'], offset: CharOffset): SourcePosition | null {
    if (typeof offset !== 'number' || Number.isNaN(offset))
        return null;

    const index = offset < 0 ? 0 : offset > document_.length ? document_.length : offset;
    const line = document_.lineAt(index);
    
    return {
        line: line.number - 1,
        ch: index - line.from,
    };
}

export function positionToOffset(document_: EditorView['state']['doc'], {line, ch}: SourcePosition): CharOffset | null {
    if (line < 0 || line >= document_.lines)
        return null;
    
    const lineInfo = document_.line(line + 1);
    
    return Math.min(lineInfo.from + ch, document_.length);
}

export function posFromIndex(view: EditorView, index: CharOffset): SourcePosition | null {
    return offsetToPosition(view.state.doc, index);
}

export function indexFromPos(view: EditorView, position: SourcePosition): CharOffset {
    return positionToOffset(view.state.doc, position)!;
}

export const getCursorIndex = (view: EditorView): CharOffset => view.state.selection.main.head;

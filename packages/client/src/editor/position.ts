import {
    posFromIndex as qwordPosFromIndex,
    type SourcePosition,
} from 'qword/client';
import type {EditorView} from '@codemirror/view';

const isNumber = (a: unknown): a is number => !Number.isNaN(a) && typeof a === 'number';

export function posFromIndex(view: EditorView, index: unknown): SourcePosition | null {
    if (!isNumber(index) || index < 0 || index > view.state.doc.length)
        return null;
    
    return qwordPosFromIndex(view, index);
}

export function indexFromPos(view: EditorView, pos: unknown): number | null {
    if (!pos || typeof pos !== 'object')
        return null;
    
    const {doc} = view.state;
    const {line, ch} = pos as SourcePosition;
    const lineCount = doc.lines;
    
    if (!isNumber(line) || line < 0 || line >= lineCount)
        return null;
    
    const lineInfo = doc.line(line + 1);
    
    if (!isNumber(ch) || ch < 0 || ch > lineInfo.length)
        return null;
    
    return lineInfo.from + ch;
}

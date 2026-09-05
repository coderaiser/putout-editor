import {posFromIndex as qwordPosFromIndex} from 'qword/client';

const isNumber = (a) => !Number.isNaN(a) && typeof a === 'number';

export function posFromIndex(view, index) {
    if (!isNumber(index) || index < 0 || index > view.state.doc.length)
        return null;
    
    return qwordPosFromIndex(view, index);
}

export function indexFromPos(view, pos) {
    if (!pos || typeof pos !== 'object')
        return null;
    
    const {doc} = view.state;
    const {line, ch} = pos;
    const lineCount = doc.lines;
    
    if (typeof line !== 'number' || line < 0 || line >= lineCount)
        return null;
    
    const lineInfo = doc.line(line + 1);
    
    if (typeof ch !== 'number' || ch < 0 || ch > lineInfo.length)
        return null;
    
    return lineInfo.from + ch;
}

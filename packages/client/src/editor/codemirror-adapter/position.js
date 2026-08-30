export function offsetToPosition(document_, offset) {
    const index = offset < 0 ? 0 : offset > document_.length ? document_.length : offset;
    const line = document_.lineAt(index);
    
    return {
        line: line.number - 1,
        ch: index - line.from,
    };
}

export function positionToOffset(document_, {line, ch}) {
    return document_.line(line + 1).from + ch;
}

export function posFromIndex(view, index) {
    return offsetToPosition(view.state.doc, index);
}

export function indexFromPos(view, position) {
    return positionToOffset(view.state.doc, position);
}

export const getCursorIndex = (view) => view.state.selection.main.head;

export function offsetToPosition(document_, offset) {
    const line = document_.lineAt(offset);
    return {line: line.number - 1, ch: offset - line.from};
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

export function getCursorIndex(view) {
    return view.state.selection.main.head;
}
export function on(view, event, handler) {
    view.contentDOM.addEventListener(event, handler);
    return [event, handler];
}

export function off(view, event, handler) {
    view.contentDOM.removeEventListener(event, handler);
}

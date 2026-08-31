export function on(view, event, handler) {
    view.dom.addEventListener(event, handler);
    return [event, handler];
}

export function off(view, event, handler) {
    view.dom.removeEventListener(event, handler);
}

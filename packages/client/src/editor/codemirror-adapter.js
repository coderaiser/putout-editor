import CodeMirror from 'codemirror';
import 'codemirror/keymap/vim.js';
import 'codemirror/keymap/emacs.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/addon/fold/foldgutter.js';
import 'codemirror/addon/fold/foldcode.js';
import 'codemirror/addon/fold/brace-fold.js';

/**
 * Create a CodeMirror instance in container. Requires real DOM.
 */
/* c8 ignore next 3 */
export const createEditor = (container, options) => CodeMirror(container, options);

/** Set editor content. */
export function setValue(editor, value) {
    editor.setValue(value);
}

/** Get editor content. */
export const getValue = (editor) => editor.getValue();

/** Set a CodeMirror option. */
export function setOption(editor, key, value) {
    editor.setOption(key, value);
}

/** Get scroll position. */
export const getScrollInfo = (editor) => editor.getScrollInfo();

/** Scroll to position. */
export function scrollTo(editor, left, top) {
    editor.scrollTo(left, top);
}

/** Refresh layout after resize. */
export function refresh(editor) {
    editor.refresh();
}

/** Add CSS class to a line. */
export function addLineClass(editor, line, where, cls) {
    editor.addLineClass(line, where, cls);
}

/** Remove CSS class from a line. */
export function removeLineClass(editor, line, where, cls) {
    editor.removeLineClass(line, where, cls);
}

/**
 * Mark a text range with a CSS class.
 * Returns mark object — call mark.clear() to remove.
 */
export function markText(editor, from, to, options) {
    return editor.markText(from, to, options);
}

/** Convert character index to {line, ch} position. */
export function posFromIndex(editor, index) {
    return editor
        .getDoc()
        .posFromIndex(index);
}

/** Convert {line, ch} position to character index. */
export function indexFromPos(editor, pos) {
    return editor
        .getDoc()
        .indexFromPos(pos);
}

/** Get cursor position as character index. */
export function getCursorIndex(editor) {
    return editor
        .getDoc()
        .indexFromPos(editor.getCursor());
}

/** Get document value (from doc not editor, for blur handler). */
export const getDocValue = (editor) => editor
    .getDoc()
    .getValue();

/** Set document value (used by prettier on blur). */
export function setDocValue(editor, value) {
    editor.doc.setValue(value);
}

/**
 * Register a CodeMirror event handler.
 * Returns [event, handler] for removal via off().
 */
export function on(editor, event, handler) {
    editor.on(event, handler);
    return [event, handler];
}

/** Remove a CodeMirror event handler. */
export function off(editor, event, handler) {
    editor.off(event, handler);
}


/**
 * Get the CodeMirror instance from a DOM container.
 * In CM5: el.CodeMirror — stable API for tests and CM6 migration.
 */
export function getView(container) {
    return container.querySelector('.CodeMirror')?.CodeMirror ?? null;
}

/**
 * Observe container resize and call refresh automatically.
 * Returns cleanup function — call on unmount.
 */
export function observeResize(editor, container) {
    const observer = new ResizeObserver(() => refresh(editor));
    observer.observe(container);
    
    return () => observer.disconnect();
}

import {
    getValue,
    markText,
    type MarkHandle,
    type QwordEditorView,
} from 'qword/client';

const COMMAND = /^\/\S*/;
const noop = () => {};

/** A mark that is not there: `clear()` does nothing. The start value of a ref. */
export const noMark: MarkHandle = {
    clear: noop,
};

/**
 * The end of the command word: `/source` in `/source const a`, and `0` when the
 * text does not start with the sigil. The word stops at a space or a line break.
 */
export const commandEndOf = (text: string): number => {
    const [command = ''] = COMMAND.exec(text) || [];
    
    return command.length;
};

/**
 * Mark the command word with `input__command`, so CSS can colour it as a
 * command and not as JavaScript. Clears `previous` first and returns the new
 * mark. Both calls dispatch, so never call this inside an `updateListener`.
 */
export const markCommand = (editor: QwordEditorView, previous: MarkHandle): MarkHandle => {
    previous.clear();
    
    const end = commandEndOf(getValue(editor));
    
    return markText(editor, {
        line: 0,
        ch: 0,
    }, {
        line: 0,
        ch: end,
    }, {
        className: 'input__command',
    });
};

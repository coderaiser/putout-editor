/** What a key needs to know about the composer. */
export interface ComposerContext {
    /** The text in the box. */
    text: string;
    
    /** The list is shown: the box has text and a command matches it. */
    open: boolean;
    
    /** The text is a whole command name, with its slash. */
    exact: boolean;
    
    /** A touch screen: its keyboard has one return key. */
    coarse: boolean;
    
    /** The index of the option that is marked. */
    picked: number;
    
    /** How many options the list has. */
    count: number;
    
    /** How far back in the history the user walked: 0 is the newest line. */
    cursor: number;
    historyLength: number;
}

export interface ComposerKey {
    key: string;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}

export type ComposerAction =
    | {
        kind: 'complete';
    }
    | {
        kind: 'send';
    }
    | {
        kind: 'clear';
    }
    | {
        kind: 'pick';
        index: number;
    }
    | {
        kind: 'history';
        index: number;
    };

/**
 * What a key does. `action` is for the caller to run. `prevent` is a
 * `preventDefault` on the event. A key with no meaning has `action: null`,
 * and the caller does not touch the event: the editor handles it.
 */
export interface ComposerResult {
    action: ComposerAction | null;
    prevent: boolean;
}

const NONE: ComposerResult = {
    action: null,
    prevent: false,
};

const COMPLETE: ComposerResult = {
    action: {
        kind: 'complete',
    },
    prevent: true,
};

const SEND: ComposerResult = {
    action: {
        kind: 'send',
    },
    prevent: true,
};

const CLEAR: ComposerResult = {
    action: {
        kind: 'clear',
    },
    prevent: false,
};

const pick = (index: number): ComposerResult => ({
    action: {
        kind: 'pick',
        index,
    },
    prevent: false,
});

const history = (index: number): ComposerResult => ({
    action: {
        kind: 'history',
        index,
    },
    prevent: false,
});

/**
 * `Enter` completes a partial name while the list is open. That is a choice
 * about the text, so it comes before the send. `Shift+Enter` is a newline in
 * every state. `Ctrl`/`Cmd+Enter` sends on both kinds of keyboard. A plain
 * `Enter` sends on a keyboard. On a touch screen it is a newline, and the
 * editor makes it.
 */
const onEnter = ({shiftKey, ctrlKey, metaKey}: ComposerKey, {open, exact, coarse}: ComposerContext): ComposerResult => {
    if (shiftKey)
        return NONE;
    
    if (!ctrlKey && !metaKey && open && !exact)
        return COMPLETE;
    
    return ctrlKey || metaKey || !coarse ? SEND : NONE;
};

/** The next option in the open list, else the way back in the history. */
const onDown = ({open, text, picked, count, cursor}: ComposerContext): ComposerResult => {
    if (open)
        return pick((picked + 1) % count);
    
    if (text)
        return NONE;
    
    return history(Math.max(cursor - 1, -1));
};

/** The previous option in the open list, else the way into the history. */
const onUp = ({open, text, picked, count, cursor, historyLength}: ComposerContext): ComposerResult => {
    if (open)
        return pick((picked - 1 + count) % count);
    
    if (text)
        return NONE;
    
    return history(Math.min(
        cursor + 1,
        historyLength,
    ));
};

/**
 * The keys of the composer, as a table with no React in it. The same cut as
 * `keyToAction` of the tree: a spec calls the function, and the component
 * only runs what it returns.
 */
export const composerKey = (event: ComposerKey, context: ComposerContext): ComposerResult => {
    const {key} = event;
    
    if (key === 'Enter')
        return onEnter(event, context);
    
    if (key === 'Tab' && context.open)
        return COMPLETE;
    
    if (key === 'Escape')
        return CLEAR;
    
    if (key === 'ArrowDown')
        return onDown(context);
    
    if (key === 'ArrowUp')
        return onUp(context);
    
    return NONE;
};

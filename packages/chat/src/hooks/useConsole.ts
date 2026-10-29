import {useMemo} from 'react';
import {useSelector} from 'react-redux';
import type {Message} from '#store';
import type {RootState} from '#store/types';

export interface ConsoleAst {
    nodes: NonNullable<RootState['chat']['consoleAst']>['nodes'];
    source: string;
}

/**
 * Is the message an `ast` answer? A `switch` on `result.type`, not `?.`:
 * `convert-optional-to-logical` rewrites `?.` and the narrowing is lost.
 */
const isAst = (message: Message): boolean => {
    const {result} = message;
    
    if (!result)
        return false;
    
    return result.type === 'ast';
};

/**
 * The most recent `ast` result, for the console panel. Read from the store's
 * own `consoleAst` rather than by scanning the transcript: the panel is meant to
 * survive a `clear` that empties the thread it came from, and a scan would go
 * blank at exactly that moment.
 */
export const useConsole = (): ConsoleAst | null => {
    const consoleAst = useSelector((root: RootState) => root.chat.consoleAst);
    const open = useSelector((root: RootState) => root.chat.consoleOpen);
    
    return useMemo(() => open && consoleAst ? consoleAst : null, [open, consoleAst]);
};

/**
 * The **newest** `ast` message in a thread, or `null`.
 *
 * Iterating backwards: a transcript is append-only, so the last `ast` is the
 * one a user means, and a forward scan would return the first — the stale one —
 * for every thread with more than one.
 */
export const latestAst = (messages: Message[]): Message | null => {
    for (const message of [...messages].reverse())
        if (isAst(message))
            return message;
    
    return null;
};

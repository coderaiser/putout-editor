import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
    commands,
    parseCommand,
    type ChatState,
    type CommandResult,
} from '@putout/editor-commands';
import type {RootState} from '#store/types';
import {
    addMessage,
    pushHistory,
    setSource,
    clearThread,
    reset,
    setConsoleAst,
    toggleConsole,
    nextId,
} from '#store';

/**
 * The two ways a line can name nothing.
 *
 * A bare word and a misspelling are the *same* thing now: `parseCommand` takes
 * the first word as the command and does not know the vocabulary, so `hello`
 * and `astt` both arrive here as an unregistered name. One answer for both is
 * the point — v8 §3 asked for a separate "not a command" error for plain text,
 * and with no slash in the grammar that branch would exist only to say the same
 * sentence. `parseError` covers the one case that is genuinely different: an
 * input with no first word at all.
 *
 * No slash anywhere, because there is nothing to prefix one to.
 */
const unknown = (name: string): CommandResult => ({
    type: 'error',
    message: `Unknown command: ${name}. Try help.`,
});

const parseError = (error: string): CommandResult => ({
    type: 'error',
    message: error,
});

/**
 * The whole of what a sent line does, in one place. Everything a command can
 * change — the source, the console tree, the panel toggle, the thread — happens
 * here, so `Input` and `Chat` are both thin and a command's effect on the store
 * is a single function to read.
 *
 * `console` is the one command with no state of its own: the registry's `run`
 * returns text, and the panel toggle is dispatched from here. A command module
 * that had to know about the store would break the one-way arrow
 * `chat → commands`.
 */
export const useChat = () => {
    const dispatch = useDispatch();
    const state = useSelector((root: RootState) => root.chat);
    
    /**
     * `source` is passed in rather than read from the selector, because the
     * recursion into `rest` happens in the same tick as the state effect above:
     * a closure over `state.source` would still hold the value from *before* this
     * command ran, so `source` followed by `ast` in one input would parse the
     * old source.
     */
    const send = useCallback(async (input: string, source = state.source) => {
        // The registry's own keys, so "a body ends at the next command" is
        // measured against the same list the dispatch below uses. Without them
        // a `source` body would swallow every following line.
        const parsed = parseCommand(input, commands.keys());
        
        // An input with no first word at all — the one thing the parser
        // refuses. It used to be dropped silently, which is the v8 §3 defect
        // in its purest form: a line sent and no answer.
        if (!('command' in parsed)) {
            dispatch(addMessage({
                id: nextId(),
                text: input,
                result: parseError(parsed.error),
            }));
            
            return;
        }
        
        const {
            command,
            args,
            rest,
        } = parsed;
        
        dispatch(pushHistory(input));
        
        const entry = commands.get(command);
        
        if (!entry) {
            dispatch(addMessage({
                id: nextId(),
                text: input,
                result: unknown(command),
            }));
            
            return;
        }
        
        const chat: ChatState = {
            source,
            plugin: state.plugin,
        };
        
        // `Command.run` is `(args, state)` — the registry's `ast` entry reads
        // its own flags, and `parseCommand` has already folded them into `args`
        // for everything else. A third argument would be a signature the
        // commands package does not have.
        const result = await entry.run(args, chat);
        
        // `clear` and `reset` both answer with `text` — the command modules
        // have no store and cannot report a state change. So which store effect
        // happens is keyed on the *command name*, not on the result type, and
        // the data those two return is a message, not a state change.
        if (command === 'source' && result.type === 'source')
            dispatch(setSource(result.data));
        
        if (command === 'clear') {
            // `clear` and `reset` are answered *after* the state effect, or the
            // answer itself would be the one message left in the thread they just
            // emptied. A user who clears the thread sees an empty thread.
            dispatch(clearThread());
            
            return;
        }
        
        if (command === 'reset') {
            dispatch(reset());
            
            return;
        }
        
        if (result.type === 'ast') {
            // The panel is still *fed* by `ast` — it survives a `clear` that
            // empties the transcript it came from — but `ast` no longer
            // *opens* it. Reverses `0e987ac`, whose reason was that the header
            // button left the user to type `console` to see what they had just
            // asked for; the answer to that is the tree in the thread, which
            // `Message` has always rendered through `AstBlock`. Opening the
            // panel as well gave every `ast` two copies of one tree, and the
            // panel took half the thread.
            dispatch(setConsoleAst({
                nodes: result.nodes,
                source: result.source,
            }));
        }
        
        if (command === 'console')
            dispatch(toggleConsole());
        
        dispatch(addMessage({
            id: nextId(),
            text: input,
            result,
        }));
        
        // `rest` runs *after* this message is dispatched, so a thread reading
        
        // `source\n…\nast` in one input keeps both answers in the order they were
        
        // sent. Recursing earlier would append `ast` above `source`.
        if (rest)
            await send(rest, result.type === 'source' ? result.data : source);
    }, [dispatch, state.source, state.plugin]);
    
    return {
        send,
        messages: state.messages,
        source: state.source,
        history: state.history,
    };
};

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
import {addressed} from '../sigil.ts';

/**
 * A line with no `/` is a sentence: tell the user to start with the sigil.
 * A line with `/` and an unknown name gets the unknown-command answer.
 */
const notACommand = (): CommandResult => ({
    type: 'error',
    message: 'Not a command. Start with / — try /help.',
});

const unknown = (name: string): CommandResult => ({
    type: 'error',
    message: `Unknown command: ${name}. Try /help.`,
});

const parseError = (error: string): CommandResult => ({
    type: 'error',
    message: error,
});

/**
 * What a sent line does, in one place: source, console tree, panel, thread.
 * `console` returns text; the panel toggle is dispatched here, so command
 * modules do not know the store (`chat → commands` only).
 */
export const useChat = () => {
    const dispatch = useDispatch();
    const state = useSelector((root: RootState) => root.chat);
    
    /**
     * Run a line that is addressed to the registry. `source` is a parameter:
     * `source` then `ast` in one input runs in one tick, and the selector
     * still holds the old source. The sigil is checked once, on the user line:
     * `/source\n…\nast` recurses into `ast`. `line` has no sigil (for the
     * parser); `echo` has it (for the thread).
     */
    const run = useCallback(async (line: string, echo: string, source: string): Promise<void> => {
        // The registry's own keys, so "a body ends at the next command" is
        // measured against the same list the dispatch below uses. Without them
        // a `source` body would swallow every following line.
        const parsed = parseCommand(line, commands.keys());
        
        // An input with no first word at all — the one thing the parser
        // refuses. It used to be dropped silently, which is the v8 §3 defect
        // in its purest form: a line sent and no answer.
        if (!('command' in parsed)) {
            dispatch(addMessage({
                id: nextId(),
                text: echo,
                result: parseError(parsed.error),
            }));
            
            return;
        }
        
        const {
            command,
            args,
            rest,
        } = parsed;
        
        dispatch(pushHistory(echo));
        
        const entry = commands.get(command);
        
        if (!entry) {
            dispatch(addMessage({
                id: nextId(),
                text: echo,
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
            text: echo,
            result,
        }));
        
        // `rest` runs *after* this message is dispatched, so a thread reading
        
        // `source\n…\nast` in one input keeps both answers in the order they were
        
        //
        
        // sent. Recursing earlier would append `ast` above `source`.
        if (rest)
            await run(rest, rest, result.type === 'source' ? result.data : source);
    }, [dispatch, state.plugin]);
    
    /**
     * The sigil gate. `trimmed &&`: an empty line goes to `parseCommand`, which
     * answers `Empty command`. `slice(1)` gives the registry the name, so a
     * misspelling reports `hello`, not `/hello`.
     */
    const send = useCallback(async (input: string, source = state.source) => {
        const trimmed = input.trimStart();
        
        if (trimmed && !addressed(trimmed)) {
            dispatch(addMessage({
                id: nextId(),
                text: input,
                result: notACommand(),
            }));
            
            return;
        }
        
        await run(trimmed.slice(1), trimmed, source);
    }, [dispatch, run, state.source]);
    
    return {
        send,
        messages: state.messages,
        source: state.source,
        history: state.history,
    };
};

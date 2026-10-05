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
 * The two ways a line can name nothing, and they are no longer the same thing.
 *
 * A line that does not start with `/` is not addressed to the registry at all — it
 * is a sentence — so it gets an answer that says what to do about it. A line that
 * *does* start with `/` and names something unregistered is a misspelling, and gets
 * the unknown-command answer. Folding them together, as this used to, meant a
 * whole sentence was answered "Unknown command: hello world", which is the wrong
 * half of the question every time the user was not aiming at the tool.
 */
const notACommand = (): CommandResult => ({
    type: 'error',
    message: 'Not a command. Start with / — try /help.',
});

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
     *
     * What a line does, once it is known to be addressed to the registry.
     *
     * Split from `send` because the sigil is a property of the line the **user**
     * sent, not of every line this runs. `parseCommand` ends a `source` body at the
     * next command name, so `/source\n…\nast` recurses into `ast` — and that `ast` is
     * part of an input the user already addressed with a sigil on the first line.
     * Re-gating it would demand a slash mid-input and break the one form of
     * multi-command input the parser goes out of its way to support.
     *
     * `line` is what the parser sees (no sigil) and `echo` is what the thread shows
     * (with it), because the two genuinely differ: the bubble has to read back
     * `/ast` while the registry is handed `ast`.
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
     * The sigil gate, and the one arm that is deliberately not a gate.
     *
     * `trimmed &&` rather than the `startsWith` test alone, because an empty line
     * is not "missing its sigil" — there is nothing there to prefix — and
     * `parseCommand` already answers it, with `Empty command`. Gating on it would
     * replace a true statement about the input with a false one, and would retire
     * the parser's own error branch.
     *
     * `slice(1)` is why a `/`-prefixed misspelling reports `hello` and not
     * `/hello`: the registry is handed the name, so the name it cannot find is the
     * one to name.
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

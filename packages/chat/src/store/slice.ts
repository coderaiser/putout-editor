import {montag} from 'montag';
import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import type {FlatNode} from '@putout/editor-commands';
import type {Message} from './state.ts';

export interface ChatAppState {
    messages: Message[];
    source: string;
    plugin: string;
    history: string[];
    
    /**
     * How far back the `↑` recall has walked: `-1` is the empty box, `0` the
     * most recent line, `1` the one before it.
     *
     * In the store rather than in `Input`'s own state, because the cursor has to
     * survive a re-render that is not caused by typing — a command's answer
     * landing in the thread re-renders the input, and a `useState` cursor set in a
     * keydown handler would be fine only by accident.
     */
    historyIndex: number;
    consoleAst: {
        nodes: FlatNode[];
        source: string;
    } | null;
    consoleOpen: boolean;
}

/**
 * The rule the chat starts with, so `/ast` answers with a tree on a fresh page
 * rather than "no source".
 *
 * Written here rather than imported from `packages/client`, whose Replacer
 * template seeds its `initialCode` the same way: `config/boundaries-config.ts`
 * makes `editor` reachable only from `parser`/`store`/`snippet`/`ui`/panels/
 * `app`, and `docs/architecture.md` records the arrow policy as enforced by
 * `boundaries/dependencies`. The idea travels; the import does not.
 *
 * A working 🐊**Putout** rule rather than a bare `const`, because the first
 * thing anyone types here is `/ast` and an expression parses into a tree with
 * nothing in it to look at. `export {report}` at the end rather than
 * `export const`, so the seed reads as the shape the docs show.
 */
export const INITIAL_SOURCE = montag`
    const report = () => \`Hello 🐊\`;
    
    export {report};
`;

export const initialState: ChatAppState = {
    messages: [],
    source: INITIAL_SOURCE,
    plugin: '',
    history: [],
    historyIndex: -1,
    consoleAst: null,
    consoleOpen: false,
};

const without = (messages: Message[], message: Message): Message[] => [
    ...messages,
    message,
];

/**
 * A message id is a counter rather than `Date.now()` or a random string: a spec
 * that asserts on the transcript needs a value it can predict, and a clock or a
 * counter source is one more thing to stub.
 */
let seq = 0;

export const nextId = (): number => ++seq;

export const {reducer, actions} = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        addMessage: (state, {payload}: PayloadAction<Message>) => ({
            ...state,
            messages: without(state.messages, payload),
        }),
        /**
         * The echo of a sent line, and the `↑` recall it feeds. Pushed before
         * the command runs, so a command that throws cannot lose what was typed.
         *
         * `historyIndex` resets to `-1` here: a new line means the box is empty
         * again, and leaving the cursor where it was would make the next `↑` jump
         * to a line from before the one just typed.
         */
        pushHistory: (state, {payload}: PayloadAction<string>) => ({
            ...state,
            history: [
                ...state.history,
                payload,
            ],
            historyIndex: -1,
        }),
        
        setHistoryIndex: (state, {payload}: PayloadAction<number>) => ({
            ...state,
            historyIndex: payload,
        }),
        
        setSource: (state, {payload}: PayloadAction<string>) => ({
            ...state,
            source: payload,
        }),
        
        setPlugin: (state, {payload}: PayloadAction<string>) => ({
            ...state,
            plugin: payload,
        }),
        /**
         * `/ast` hands the console panel its own copy of the tree, so the panel
         * survives a `/clear` that empties the transcript it came from.
         */
        setConsoleAst: (state, {payload}: PayloadAction<{nodes: FlatNode[];source: string;}>) => ({
            ...state,
            consoleAst: payload,
        }),
        
        toggleConsole: (state) => ({
            ...state,
            consoleOpen: !state.consoleOpen,
        }),
        /**
         * `/ast` opens the panel rather than toggling it.
         *
         * Toggling would be the smaller change and the wrong one: run `/ast`
         * twice and the panel closes itself, which reads as the command being
         * broken. This is a separate action so "make it visible" and "flip it"
         * stop being the same verb.
         */
        openConsole: (state) => ({
            ...state,
            consoleOpen: true,
        }),
        
        clearThread: (state) => ({
            ...state,
            messages: [],
        }),
        
        reset: () => initialState,
    },
});

export const {
    addMessage,
    pushHistory,
    setHistoryIndex,
    setSource,
    setPlugin,
    setConsoleAst,
    toggleConsole,
    openConsole,
    clearThread,
    reset,
} = actions;

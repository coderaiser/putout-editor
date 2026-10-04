import {montag} from 'montag';
import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import {
    commands,
    runHelp,
    type FlatNode,
} from '@putout/editor-commands';
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
 * The rule the chat opens on, so `ast` answers with a tree on a fresh page
 * rather than "no source".
 *
 * The `replacer` template from `packages/client`'s New menu, copied rather
 * than imported: `config/boundaries-config.ts` makes `editor` reachable only
 * from `parser`/`store`/`snippet`/`ui`/panels/`app`, and `docs/architecture.md`
 * records the arrow policy as enforced by `boundaries/dependencies`. The idea
 * travels; the import does not — which is also why the copy can drift from the
 * template, and why `slice.spec` pins what the seed actually contains.
 *
 * A working 🐊**Putout** rule rather than a bare `const`, because the first
 * thing anyone types here is `ast` and an expression parses into a tree with
 * nothing in it to look at. `export {report}` at the end rather than
 * `export const`, so the seed reads as the shape the docs show.
 */
export const INITIAL_SOURCE = montag`
    // convert-ternary-to-if
    
    export const report = () => \`Use 'if' instead of ternary 🧹\`;
    
    export const replace = () => ({
        '__a ? __b : __c': 'if (__a) __b; else __c;',
    });
`;

/**
 * The two messages the page opens with: `source`, already used, and `help`.
 *
 * This is the answer to "a user opened this in a browser and has no idea what
 * to type". A command list on its own is a reference — it says what exists,
 * not what a line of this looks like or that the tool answers at all. So the
 * thread opens with a **worked example**: the echo of the `source` command and
 * its own output, immediately followed by the help.
 *
 * The ids are 0 and 1 rather than `nextId()`, because these are the first two
 * messages by construction and the counter is shared with everything the user
 * sends afterwards. Handing out 0 and 1 keeps `slice.spec`'s "starts empty"
 * arithmetic honest and costs nothing.
 *
 * `runHelp` and not a written-out list, so the seeded help and the answer to
 * typing `help` are the same string — they are built from the same registry, so
 * adding a command cannot leave the opening screen behind.
 */
const seeded = (): Message[] => [{
    id: 0,
    text: `source\n${INITIAL_SOURCE}`,
    result: {
        type: 'source',
        data: INITIAL_SOURCE,
    },
}, {
    id: 1,
    text: 'help',
    result: runHelp([...commands.values()]),
}];

export const initialState: ChatAppState = {
    messages: seeded(),
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

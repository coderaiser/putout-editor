import {montag} from 'montag';
import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from '@reduxjs/toolkit';
import {
    type FlatLearnNode,
    commands,
    runHelp,
    type FlatNode,
} from '@putout/editor-commands';

/**
 * Open a concept in one dispatch: the body, then `[try it →]` when the leaf
 * has an example. A `createAsyncThunk`, so `fulfilled` carries both
 * messages. `meta.arg` is the row, which has `body` and `example`. Only a
 * leaf comes here: `Enter` on a container expands it.
 */
import type {Message} from './state.ts';

export const learnOpen = createAsyncThunk('chat/learnOpen', async (node: FlatLearnNode) => node);

export interface ChatAppState {
    messages: Message[];
    source: string;
    plugin: string;
    history: string[];
    
    /**
     * The `↑` recall position: `-1` is the empty box, `0` the last line.
     * In the store, so it survives a re-render from a new answer.
     */
    historyIndex: number;
    consoleAst: {
        nodes: FlatNode[];
        source: string;
    } | null;
    consoleOpen: boolean;
}

/**
 * The rule the chat opens on, so `ast` has a tree. The `replacer` template
 * of the client, copied: boundaries forbid the import. `slice.spec` checks
 * the content.
 */
export const INITIAL_SOURCE = montag`
    export const report = () => \`Use 'if' instead of ternary 🧹\`;
    
    export const replace = () => ({
        '__a ? __b : __c': 'if (__a) __b; else __c;',
    });
`;

/**
 * The opening thread: `source` with its output, then `help`. Ids 0 and 1.
 * `runHelp` builds the help from the registry, like a typed `help`.
 */
const seeded = (): Message[] => [{
    id: 0,
    text: `/source\n${INITIAL_SOURCE}`,
    result: {
        type: 'source',
        data: INITIAL_SOURCE,
    },
}, {
    id: 1,
    text: '/help',
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
 * Message ids are a counter: specs can predict it. It starts at the highest
 * seeded id, so a new message does not repeat a seeded `key`.
 */
export const highestId = (messages: Message[]): number => Math.max(...messages.map(({id}) => id));

let seq = highestId(initialState.messages);

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
         * `ast` hands the console panel its own copy of the tree, so the panel
         * survives a `clear` that empties the transcript it came from.
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
         * `ast` opens the panel rather than toggling it.
         *
         * Toggling would be the smaller change and the wrong one: run `ast`
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
    /**
     * `learnOpen` adds the body as `text`, then `[try it →]` when the leaf has
     * an example.
     */
    extraReducers: (builder) => {
        builder.addCase(learnOpen.fulfilled, (state, {payload}) => ({
            ...state,
            messages: [
                ...without(state.messages, {
                    id: nextId(),
                    text: `/learn ${payload.id}`,
                    result: {
                        type: 'text' as const,
                        data: payload.body,
                    },
                }),
                ...payload.example
                    ? [{
                        id: nextId(),
                        text: `/learn ${payload.id}`,
                        result: {
                            type: 'tryit' as const,
                            source: payload.example,
                        },
                    }]
                    : [],
            ],
        }));
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
} = actions;/**
 * The thunk itself, for `LearnBlock` to dispatch.
 *
 * Declared `const` above the slice and exported here, so it reads beside the
 * reducer that consumes it: the slice owns what two messages to append, the
 * component only says which leaf was opened.
 */


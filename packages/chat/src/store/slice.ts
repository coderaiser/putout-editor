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

export const initialState: ChatAppState = {
    messages: [],
    source: '',
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
    clearThread,
    reset,
} = actions;

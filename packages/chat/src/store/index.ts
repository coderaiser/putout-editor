export {
    reducer,
    addMessage,
    pushHistory,
    setSource,
    setPlugin,
    setConsoleAst,
    toggleConsole,
    clearThread,
    reset,
    initialState,
    nextId,
} from './slice.ts';

export {createAppStore} from './createStore.ts';

export {rootReducer} from './root.ts';

export {
    setHighlight,
    setCursor,
    clearHighlight,
} from './highlight.ts';

export type {Message} from './state.ts';
export type {
    CommandResult,
    FlatNode,
    Place,
} from '@putout/editor-commands';

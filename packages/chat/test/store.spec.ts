import {test} from 'supertape';
import {makeStore} from '#test/store';
import {
    initialState,
    INITIAL_SOURCE,
} from '#store';

/**
 * `makeStore()` with no overrides is the state the **page** starts in.
 *
 * `messages` is the seed rather than `[]`, which is the change from a thread
 * that opened empty — see `slice.spec`'s "starts on the seeded thread". It is
 * spelled out here rather than deferred to `initialState` on purpose: this spec
 * exists to catch a field that silently stops being seeded, and a
 * `deepEqual(result, initialState)` would pass for that.
 */
test('test/store: the store starts at the initial state', (t) => {
    const store = makeStore();
    
    const result = store.getState().chat;
    const expected = {
        messages: initialState.messages,
        source: INITIAL_SOURCE,
        plugin: '',
        history: [],
        historyIndex: -1,
        consoleAst: null,
        consoleOpen: false,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('test/store: a dispatch reaches the chat slice', (t) => {
    const store = makeStore();
    
    store.dispatch({
        type: 'chat/setSource',
        payload: 'const a = 1;',
    });
    
    const result = store.getState().chat.source;
    const expected = 'const a = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('test/store: two stores do not share state', (t) => {
    const one = makeStore();
    const two = makeStore();
    
    one.dispatch({
        type: 'chat/setSource',
        payload: 'const a = 1;',
    });
    
    const result = two.getState().chat.source;
    const expected = INITIAL_SOURCE;
    
    t.equal(result, expected);
    t.end();
});

test('test/store: overrides preload only what a spec names', (t) => {
    const store = makeStore({
        source: 'const a = 1;',
    });
    
    const result = {
        source: store.getState().chat.source,
        plugin: store.getState().chat.plugin,
    };
    
    const expected = {
        source: 'const a = 1;',
        plugin: '',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('test/store: an override of history leaves the rest initial', (t) => {
    const store = makeStore({
        history: ['/ast'],
    });
    
    const result = {
        history: store.getState().chat.history,
        historyIndex: store.getState().chat.historyIndex,
    };
    
    const expected = {
        history: ['/ast'],
        historyIndex: -1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

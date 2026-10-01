import {test} from 'supertape';
import {renderHook, act} from '@testing-library/react';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import type {Store} from '@reduxjs/toolkit';
import {makeStore} from '#test/store';
import type {RootState} from '#store/types';
import {useChat} from './useChat.ts';

type ChatStore = Store<RootState>;

const wrap = (store: Store) => ({children}: {children: ReactNode;}) => (
    <Provider store={store}>
        {children}
    </Provider>
);

const setup = () => {
    const store = makeStore();
    const wrapper = wrap(store);
    
    const {result} = renderHook(() => useChat(), {
        wrapper,
    });
    
    return {
        store,
        result,
        send: async (input: string) => {
            await act(async () => {
                await result.current.send(input);
            });
        },
    };
};

const texts = (store: ChatStore): string[] => store
    .getState()
    .chat
    .messages
    .map(({text}) => text);

test('useChat: /source sets the buffer and answers', async (t) => {
    const {store, send} = setup();
    
    await send('/source\nconst a = 1;');
    
    const result = store.getState().chat.source;
    const expected = 'const a = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: /source records the line in the thread', async (t) => {
    const {store, send} = setup();
    
    await send('/source\nconst a = 1;');
    
    const result = texts(store);
    const expected = ['/source\nconst a = 1;'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useChat: a sent line goes into the history', async (t) => {
    const {store, send} = setup();
    
    await send('/help');
    
    const result = store.getState().chat.history;
    const expected = ['/help'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useChat: /ast hands the console panel a tree', async (t) => {
    const {store, send} = setup();
    
    await send('/source\nconst a = 1;');
    await send('/ast');
    
    const result = store.getState().chat.consoleAst && store.getState().chat.consoleAst.source;
    const expected = 'const a = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: /console toggles the panel', async (t) => {
    const {store, send} = setup();
    
    await send('/console');
    
    const result = store.getState().chat.consoleOpen;
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: /clear empties the thread but keeps the source', async (t) => {
    const {store, send} = setup();
    
    await send('/source\nconst a = 1;');
    await send('/clear');
    
    const result = {
        messages: store.getState().chat.messages.length,
        source: store.getState().chat.source,
    };
    
    const expected = {
        messages: 0,
        source: 'const a = 1;',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useChat: /reset empties the source too', async (t) => {
    const {store, send} = setup();
    
    await send('/source\nconst a = 1;');
    await send('/reset');
    
    const result = store.getState().chat.source;
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: an unknown command answers with an error', async (t) => {
    const {store, send} = setup();
    
    await send('/notacommand');
    
    const [last] = store.getState().chat.messages;
    const result = last.result && last.result.type;
    const expected = 'error';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: an unknown command names itself in the error', async (t) => {
    const {store, send} = setup();
    
    await send('/notacommand');
    
    const [last] = store.getState().chat.messages;
    const result = last.result && last.result.type === 'error' && last.result.message;
    const expected = 'Unknown command: /notacommand. Try /help.';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: a line that is not a command is ignored', async (t) => {
    const {store, send} = setup();
    
    await send('hello');
    
    const result = store.getState().chat.messages.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: /ast with no source answers with an error', async (t) => {
    const {store, send} = setup();
    
    await send('/ast');
    
    const [last] = store.getState().chat.messages;
    const result = last.result && last.result.type;
    const expected = 'error';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: /find reports where a plugin matches', async (t) => {
    const {store, send} = setup();
    
    await send('/source\nconst a = 1;');
    await send('/find\nexport const report = () => "x";\nexport const replace = () => ({"const __a = __b": "let __a = __b"});');
    
    const {messages} = store.getState().chat;
    const last = messages.at(-1);
    const result = last.result && last.result.type;
    const expected = 'places';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: a second command in the same input also runs', async (t) => {
    const {store, send} = setup();
    
    await send('/source\nconst a = 1;\n/ast');
    
    const result = store.getState().chat.consoleAst !== null;
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

import {test} from 'supertape';
import {makeStore} from '#test/store';

test('test/store: the store starts at the initial state', (t) => {
    const store = makeStore();
    
    const result = store.getState().chat;
    const expected = {
        messages: [],
        source: '',
        plugin: '',
        history: [],
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
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

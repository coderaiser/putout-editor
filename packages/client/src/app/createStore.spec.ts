import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';
import {createAppStore} from './createStore.ts';
import {setKeyMap} from '../store/reducers.ts';
import {initialState} from '../store/state.ts';

test('createAppStore: reduces with the editor slice', (t) => {
    const store = createAppStore();
    
    store.dispatch(setKeyMap('emacs'));
    
    const result = store.getState().workbench.keyMap;
    const expected = 'emacs';
    
    t.equal(result, expected);
    t.end();
});

test('createAppStore: runs the parser listener on INIT', async (t) => {
    const store = createAppStore();
    
    store.dispatch({
        type: 'INIT',
    });
    
    await setImmediate();
    
    const result = Boolean(store.getState().workbench.parseResult);
    
    t.ok(result);
    t.end();
});

test('createAppStore: parses the code it is given', async (t) => {
    const store = createAppStore({
        ...initialState,
        workbench: {
            ...initialState.workbench,
            code: 'const a = 1;',
        },
    });
    
    store.dispatch({
        type: 'INIT',
    });
    
    await setImmediate();
    
    const result = store.getState().workbench.parseResult?.ast;
    const expected = 'object';
    
    t.equal(typeof result, expected);
    t.end();
});

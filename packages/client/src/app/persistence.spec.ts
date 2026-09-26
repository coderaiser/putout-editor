import {test} from 'supertape';
import {installPersistence} from './persistence.ts';
import {
    initialState,
    type Revision,
    type State,
} from '../store/state.ts';

const noop = () => {};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const makeStore = (state: State) => {
    const written: unknown[] = [];
    let listener: (() => void) | null = null;
    
    const store = {
        getState: () => state as State,
        subscribe: (next: () => void) => {
            listener = next;
            
            return () => {
                listener = null;
            };
        },
    };
    
    return {
        store,
        written,
        fire: () => listener?.(),
    };
};

test('installPersistence: writes the persisted state', async (t) => {
    const {
        store,
        written,
        fire,
    } = makeStore(initialState);
    
    installPersistence(store, (next: unknown) => {
        written.push(next);
    });
    
    fire();
    await wait(150);
    
    const result = written.length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('installPersistence: does not write while a revision is open', async (t) => {
    const {
        store,
        written,
        fire,
    } = makeStore({
        ...initialState,
        
        // getRevision only has to be truthy here; the listener never calls it.
        activeRevision: ({} as Revision),
    });
    
    installPersistence(store, (next: unknown) => {
        written.push(next);
    });
    
    fire();
    await wait(150);
    
    const result = written.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('installPersistence: returns an unsubscribe function', (t) => {
    const {store} = makeStore(initialState);
    
    const result = typeof installPersistence(store, noop);
    const expected = 'function';
    
    t.equal(result, expected);
    t.end();
});

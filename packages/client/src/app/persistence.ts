import debounce from './debounce.ts';
import {persist} from '../store/revive.ts';
import type {State} from '../store/state.ts';
import {getRevision} from '../store/selectors.ts';

type StoreLike = {
    getState: () => State;
    subscribe: (listener: () => void) => () => void;
};

/**
 * Persist the state on each change, but not while a revision is open: a
 * revision is read-only. Debounced: parse and format dispatch on the same
 * tick. `write` is a parameter, so a spec can watch it.
 */
export const installPersistence = (store: StoreLike, write: (state: unknown) => void) => {
    return store.subscribe(debounce(() => {
        const state = store.getState();
        
        if (getRevision(state))
            return;
        
        write(persist(state));
    }));
};

import debounce from './debounce.ts';
import {persist} from '../store/revive.ts';
import type {State} from '../store/state.ts';
import {getRevision} from '../store/selectors.ts';

type StoreLike = {
    getState: () => State;
    subscribe: (listener: () => void) => () => void;
};

/**
 * Persist the state on every change, except while an existing revision is open.
 *
 * A revision is read-only: its code is the snippet's, and persisting over it
 * would make the next visit show edited code that was never saved. The write is
 * debounced because parse and format both dispatch on the same tick as the
 * action that triggered them.
 *
 * `write` is a parameter so a spec can observe it, and so the app can pass
 * `LocalStorage.writeState` without this module importing storage.
 */
export const installPersistence = (store: StoreLike, write: (state: unknown) => void) => {
    return store.subscribe(debounce(() => {
        const state = store.getState();
        
        if (getRevision(state))
            return;
        
        write(persist(state));
    }));
};

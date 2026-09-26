import type {State} from '../store/state.ts';
import {canSaveTransform} from '../store/selectors.ts';

type StoreLike = {
    getState: () => State;
    dispatch: (action: {
        type: string;
    }) => void;
};

const SNIPPET_LOAD = 'snippet/load';

const UNSAVED = 'You have unsaved transform code. Do you really want to leave?';

/**
 * The two global handlers the app installs, plus the first snippet load.
 *
 * Kept in one place so a spec can drive them without touching globals, and so
 * the hash rule - a URL hash means a snippet to load, no hash means nothing -
 * is testable. Returns the installed handlers as well as setting them, because
 * asserting on `globalThis` alone would only prove a property was assigned.
 */
export const installHandlers = (store: StoreLike) => {
    const onHashChange = () => store.dispatch({
        type: SNIPPET_LOAD,
    });
    
    const onBeforeUnload = () => {
        const state = store.getState();
        
        if (canSaveTransform(state))
            return UNSAVED;
    };
    
    globalThis.onhashchange = onHashChange;
    globalThis.onbeforeunload = onBeforeUnload;
    
    if (location.hash.length > 1)
        store.dispatch({
            type: SNIPPET_LOAD,
        });
    
    return {
        onHashChange,
        onBeforeUnload,
    };
};

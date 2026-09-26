import {configureStore} from '@reduxjs/toolkit';
import {putoutEditor, revive} from '../store/reducers.ts';
import type {State} from '../store/state.ts';
import {parserListener} from '../store/parserMiddleware.ts';
import {formatListener} from '../store/formatMiddleware.ts';
import {createSnippetListener} from '../snippet/snippetMiddleware.ts';
import * as gist from '../snippet/storage/gist.ts';
import * as parse from '../snippet/storage/parse.ts';
import StorageHandler from '../snippet/storage/index.ts';

/**
 * The store the app boots with.
 *
 * The middleware order is the whole point of this existing on its own: the
 * snippet listener is prepended last so it sees an action before format and
 * parse rewrite the state it is about to persist. Every listener is a module
 * singleton from `createListenerMiddleware`, and each has its own spec, so what
 * is untested here is only that the chain is wired at all - which is what the
 * INIT test below pins: dispatching INIT is enough for the parser listener to
 * parse and dispatch a parse result, and nothing but this chain does that.
 */
export const createAppStore = (preloadedState?: State) => {
    const storageAdapter = new StorageHandler([gist, parse]);
    const snippetListener = createSnippetListener(storageAdapter);
    
    return configureStore({
        reducer: putoutEditor,
        preloadedState: revive(preloadedState),
        middleware: (getDefault) => getDefault({
            serializableCheck: false,
        })
            .prepend(parserListener.middleware)
            .prepend(snippetListener.middleware)
            .prepend(formatListener.middleware),
    });
};

import {configureStore} from '@reduxjs/toolkit';
import {putoutEditor, revive} from '#store';
import type {State} from '../store/state.ts';
import {parserListener} from '../store/parserMiddleware.ts';
import {formatListener} from '../store/formatMiddleware.ts';
import {createSnippetListener} from '../snippet/snippetMiddleware.ts';
import * as gist from '../snippet/storage/gist.ts';
import * as parse from '../snippet/storage/parse.ts';
import StorageHandler from '../snippet/storage/index.ts';

/**
 * The app store. The snippet listener comes last in the prepend order, so
 * it sees an action before format and parse change the state. The INIT test
 * checks that the chain is wired: INIT makes the parser listener parse.
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

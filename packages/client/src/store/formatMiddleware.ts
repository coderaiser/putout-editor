import {createListenerMiddleware} from '@reduxjs/toolkit';
import {
    type RootState,
    editorKeydown,
    transformKeydown,
    setCode,
    setTransformState,
} from './reducers.ts';
import {
    getCode,
    getTransformCode,
} from './selectors.ts';
import {formatInput, formatRule} from '../editor/format.ts';

// Warm up the printer so the first format on keydown does not wait for the chunk.
import('@putout/printer');

export const formatListener = createListenerMiddleware();

const startAppListening = formatListener.startListening.withTypes<RootState>();

startAppListening({
    actionCreator: editorKeydown,
    effect: async (_, api) => {
        const state = api.getState();
        const source = getCode(state);
        const {parseResult} = state.workbench;
        const {ast} = parseResult || {};
        
        const [formatError, formatted] = await formatInput(source, ast);
        
        if (formatError)
            return;
        
        // Staleness check — bail out if the code changed while formatting
        if (getCode(api.getState()) !== source)
            return;
        
        api.dispatch(setCode({
            code: formatted,
        }));
    },
});

startAppListening({
    actionCreator: transformKeydown,
    effect: async (_, api) => {
        const state = api.getState();
        const source = getTransformCode(state);
        
        const [error, code] = await formatRule(source);
        
        if (error)
            return;
        
        // Staleness check — bail out if the code changed while formatting
        /* c8 ignore start */
        if (getTransformCode(api.getState()) !== source) {
            return;
        }
        /* c8 ignore stop */
        
        api.dispatch(setTransformState({
            code,
        }));
    },
});

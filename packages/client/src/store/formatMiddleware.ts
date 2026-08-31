import {createListenerMiddleware} from '@reduxjs/toolkit';
import {
    type RootState,
    editorBlur,
    transformBlur,
    setCode,
    setTransformState,
} from './reducers.ts';
import {
    getParseResult,
    getCode,
    getTransformCode,
} from './selectors.ts';
import {formatInput, formatRule} from '../transform/format.ts';

export const formatListener = createListenerMiddleware();

const startAppListening = formatListener.startListening.withTypes<RootState>();

startAppListening({
    actionCreator: editorBlur,
    effect: async (_, api) => {
        const state = api.getState();
        const {ast} = getParseResult(state);
        const source = getCode(state);
        
        const [error, formatted] = await formatInput(source, ast);
        
        if (error)
            return;
        
        api.dispatch(setCode({
            code: formatted,
            cursor: 0,
        }));
    },
});

const startFormatListening = formatListener.startListening.withTypes<RootState>();

startFormatListening({
    actionCreator: transformBlur,
    effect: async (_, api) => {
        const state = api.getState();
        const source = getTransformCode(state);
        const [error, code] = await formatRule(source);
        
        if (error)
            return;
        
        api.dispatch(setTransformState({
            code,
        }));
    },
});

import {createListenerMiddleware} from '@reduxjs/toolkit';
import type {Node} from '@putout/babel';
import {
    type RootState,
    editorBlur,
    transformBlur,
    setCode,
    setTransformState,
    setFormatError,
} from './reducers.ts';
import {
    getParseResult,
    getCode,
    getTransformCode,
} from './selectors.ts';
import {
    formatInput,
    formatRule,
    Skip,
} from '../editor/format.ts';

export const formatListener = createListenerMiddleware<RootState>();

const startAppListening = formatListener.startListening.withTypes<RootState>();

startAppListening({
    actionCreator: editorBlur,
    effect: async (_, api) => {
        const state = api.getState();
        const parseResult = getParseResult(state);
        const ast = parseResult && parseResult.ast;
        const source = getCode(state);
        
        const [error, formatted] = await formatInput(source, ast as Node);
        
        if (error instanceof Skip)
            return;
        
        if (error) {
            api.dispatch(setFormatError(error.message));
            return;
        }
        
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
        
        if (error instanceof Skip)
            return;
        
        if (error) {
            api.dispatch(setFormatError(error.message));
            return;
        }
        
        api.dispatch(setTransformState({
            code,
        }));
    },
});

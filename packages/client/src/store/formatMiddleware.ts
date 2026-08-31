import {createListenerMiddleware} from '@reduxjs/toolkit';
import {tryCatch} from 'try-catch';
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

export const formatListener = createListenerMiddleware();

const startAppListening = formatListener.startListening.withTypes<RootState>();

startAppListening({
    actionCreator: editorBlur,
    effect: async (_, api) => {
        const state = api.getState();
        const ast = getParseResult(state)?.ast;
        
        if (!ast)
            return;
        
        const {print} = await import('@putout/printer');
        const formatted = print(ast);
        
        const code = getCode(state);
        
        if (formatted === code)
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
        const code = getTransformCode(state);
        
        if (!code)
            return;
        
        const {parse} = await import('@babel/parser');
        const {default: plugins} = await import('@putout/engine-parser/babel/plugins');
        
        const [error, ast] = tryCatch(parse, code, {
            sourceType: 'module',
            plugins,
        });
        
        if (error)
            return;
        
        const {print} = await import('@putout/printer');
        const formatted = print(ast);
        
        if (formatted === code)
            return;
        
        api.dispatch(setTransformState({
            code: formatted,
        }));
    },
});

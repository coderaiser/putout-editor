import {type Print} from '@putout/printer';
import {createListenerMiddleware} from '@reduxjs/toolkit';
import {tryCatch} from 'try-catch';
import {parse} from '@babel/parser';
import plugins from '@putout/engine-parser/babel/plugins';
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

const parseTransform = (code: string) => {
    const [error, ast] = tryCatch(parse, code, {
        sourceType: 'module',
        plugins,
    });
    
    if (error)
        return null;
    
    return ast;
};

let _print: Print;

const getPrint = async () => {
    if (_print)
        return _print;
    
    const {print} = await import('@putout/printer');
    
    _print = print as Print;
    
    return _print;
};

const startAppListening = formatListener.startListening.withTypes<RootState>();

startAppListening({
    actionCreator: editorBlur,
    effect: async (_, api) => {
        const state = api.getState();
        const ast = getParseResult(state)?.ast;
        
        if (!ast)
            return;
        
        const print = await getPrint();
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
        
        const ast = parseTransform(code);
        
        if (!ast)
            return;
        
        const print = await getPrint();
        const formatted = print(ast);
        
        if (formatted === code)
            return;
        
        api.dispatch(setTransformState({
            code: formatted,
        }));
    },
});

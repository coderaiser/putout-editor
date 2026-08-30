import {createListenerMiddleware} from '@reduxjs/toolkit';
import {tryCatch} from 'try-catch';
import {parse} from '@babel/parser';
import plugins from '@putout/engine-parser/babel/plugins';
import {editorBlur, transformBlur, setCode, setTransformState} from './reducers.js';
import {getParseResult, getCode, getTransformCode} from './selectors.js';

export const formatListener = createListenerMiddleware();

let _print = null;

const getPrint = async () => {
    if (_print)
        return _print;
    
    const mod = await import('@putout/printer');
    _print = mod.print;
    return _print;
};

const format = (print, ast) => {
    const [error, result] = tryCatch(print, ast);
    
    if (error)
        return null;
    
    return result;
};

const parseTransform = (code) => {
    const [error, ast] = tryCatch(parse, code, {
        sourceType: 'module',
        plugins,
    });
    
    if (error)
        return null;
    
    return ast;
};

formatListener.startListening({
    actionCreator: editorBlur,
    effect: async (_, api) => {
        const state = api.getState();
        const ast = getParseResult(state)?.ast;
        
        if (!ast)
            return;
        
        const print = await getPrint();
        const formatted = format(print, ast);
        
        if (!formatted)
            return;
        
        const code = getCode(state);
        
        if (formatted === code)
            return;
        
        api.dispatch(setCode({
            code: formatted,
            cursor: 0,
        }));
    },
});

formatListener.startListening({
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
        const formatted = format(print, ast);
        
        if (!formatted)
            return;
        
        if (formatted === code)
            return;
        
        api.dispatch(setTransformState({
            code: formatted,
        }));
    },
});

import {createListenerMiddleware} from '@reduxjs/toolkit';
import {tryCatch} from 'try-catch';
import {editorBlur, setCode} from './reducers.ts';
import {getParseResult, getCode} from './selectors.ts';

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

import {createListenerMiddleware} from '@reduxjs/toolkit';
import {editorBlur, setCode} from './reducers.js';
import {getParseResult, getCode} from './selectors.js';

export const formatListener = createListenerMiddleware();

let _print = null;

const getPrint = async () => {
    if (_print)
        return _print;
    
    const mod = await import('@putout/printer');
    _print = mod.print;
    return _print;
};

formatListener.startListening({
    actionCreator: editorBlur,
    effect: async (_, api) => {
        const state = api.getState();
        const ast = getParseResult(state)?.ast;
        
        if (!ast)
            return;
        
        const print = await getPrint();
        
        let formatted;
        
        try {
            formatted = print(ast);
        } catch {
            return;
        }
        
        const code = getCode(state);
        
        if (formatted === code)
            return;
        
        api.dispatch(setCode({
            code: formatted,
            cursor: 0,
        }));
    },
});

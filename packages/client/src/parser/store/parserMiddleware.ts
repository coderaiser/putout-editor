import {createListenerMiddleware} from '@reduxjs/toolkit';
import {tryToCatch} from 'try-to-catch';
import {parseCode} from '../../store/operations.ts';
import {setParseResult, type RootState} from '../../store/reducers.ts';
import {getParser} from './parserSelectors.ts';
import {
    getParserSettings,
    getCode,
} from '../../store/selectors.ts';

export const parserListener = createListenerMiddleware<RootState>();

parserListener.startListening({
    predicate: (action, current, previous) => {
        return action.type === 'INIT'
            || getParser(current) !== getParser(previous)
            || getCode(current) !== getCode(previous)
            || getParserSettings(current) !== getParserSettings(previous);
    },
    
    effect: async (_, api) => {
        const state = api.getState();
        const parser = getParser(state);
        const code = getCode(state);
        const originalParserSettings = getParserSettings(state);
        let parserSettings = originalParserSettings;
        
        if (!parser || code == null)
            return;
        
        if (parserSettings?.plugins) {
            const plugins = parserSettings.plugins.filter((a: string) => {
                if (a === 'importAssertions')
                    return false;
                
                return a !== 'importAttributes' && a[0] !== 'importAttributes';
            });
            
            parserSettings = {
                ...parserSettings,
                plugins,
            };
        }
        
        const start = Date.now();
        const [error, result] = await tryToCatch(parseCode, parser, code, parserSettings);
        
        // Staleness checks — bail if state changed during async
        const nowState = api.getState();
        
        if (getParser(nowState) !== parser)
            return;
        
        if (getCode(nowState) !== code)
            return;
        
        if (getParserSettings(nowState) !== originalParserSettings)
            return;
        
        if (error) {
            api.dispatch(setParseResult({
                time: null,
                ast: null,
                treeAdapter: null,
                error,
            }));
            return;
        }
        
        api.dispatch(setParseResult({
            time: Date.now() - start,
            ...result,
            error: null,
        }));
    },
});

import {tryToCatch} from 'try-to-catch';
import {parseCode} from './operations.js';
import {
    getParserSettings,
    getCode,
} from './selectors.js';
import {getParser} from './parserSelectors.js';

export default (store) => (next) => async (action) => {
    const oldState = store.getState();
    next(action);
    const newState = store.getState();
    
    const newParser = getParser(newState);
    const newParserSettings = getParserSettings(newState);
    const newCode = getCode(newState);
    
    if (action.type === 'INIT' || getParser(oldState) !== newParser || getParserSettings(oldState) !== newParserSettings || getCode(oldState) !== newCode) {
        if (!newParser || newCode == null)
            return;
        
        const start = Date.now();
        
        if (newParserSettings) {
            const {plugins} = newParserSettings;
            
            newParserSettings.plugins = plugins.filter((a) => {
                if (a === 'importAssertions')
                    return false;
                
                return a !== 'importAttributes' && a[0] !== 'importAttributes';
            });
        }
        
        const [error, result] = await tryToCatch(parseCode, newParser, newCode, newParserSettings);
        
        if (error) {
            next({
                type: 'SET_PARSE_RESULT',
                result: {
                    time: null,
                    ast: null,
                    treeAdapter: null,
                    error,
                },
            });
            return;
        }
        
        if (newParser !== getParser(store.getState()))
            return;
        
        if (newCode !== getCode(store.getState()))
            return;
        
        if (newParserSettings !== getParserSettings(store.getState()))
            return;
        
        next({
            type: 'SET_PARSE_RESULT',
            result: {
                time: Date.now() - start,
                ...result,
                error: null,
            },
        });
    }
};

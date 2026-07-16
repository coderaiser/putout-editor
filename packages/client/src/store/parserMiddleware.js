import {estreeToBabel} from 'estree-to-babel';
import {
    getParserSettings,
    getCode,
} from './selectors.js';
import {getParser} from './parserSelectors.js';
import {
    ignoreKeysFilter,
    locationInformationFilter,
    functionFilter,
    emptyKeysFilter,
    typeKeysFilter,
} from '../core/TreeAdapter.js';

async function parse(parser, code, parserSettings) {
    const settings = parserSettings || parser.getDefaultOptions();
    
    if (!parser._promise)
        parser._promise = new Promise(parser.loadParser);
    
    const realParser = await parser._promise;
    const ast = parser.parse(realParser, code, settings);
    
    return estreeToBabel(ast);
}

export default (store) => (next) => (action) => {
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
        
        return parse(newParser, newCode, newParserSettings).then((ast) => {
            // Did anything change in the meantime?
            if (newParser !== getParser(store.getState()) || newParserSettings !== getParserSettings(store.getState()) || newCode !== getCode(store.getState()))
                return;
            
            // Temporary adapter for parsers that haven't been migrated yet.
            const treeAdapter = {
                type: 'default',
                options: {
                    openByDefault: (newParser.opensByDefault || (() => false)).bind(newParser),
                    nodeToRange: newParser.nodeToRange.bind(newParser),
                    nodeToName: newParser.getNodeName.bind(newParser),
                    walkNode: newParser.forEachProperty.bind(newParser),
                    filters: [
                        ignoreKeysFilter(newParser._ignoredProperties),
                        functionFilter(),
                        emptyKeysFilter(),
                        locationInformationFilter(newParser.locationProps),
                        typeKeysFilter(newParser.typeProps),
                    ],
                },
            };
            
            next({
                type: 'SET_PARSE_RESULT',
                result: {
                    time: Date.now() - start,
                    ast,
                    error: null,
                    treeAdapter,
                },
            });
        }, (error) => {
            next({
                type: 'SET_PARSE_RESULT',
                result: {
                    time: null,
                    ast: null,
                    treeAdapter: null,
                    error,
                },
            });
        });
    }
};

import * as actions from './actions.js';
import {logEvent, logError} from '../utils/logger.js';
import {loadSnippetFromURL, saveRevision} from './operations.js';
import {
    getParserSettings,
    getCode,
    isSaving,
    isForking,
    getRevision,
    getTransformCode,
    showTransformer,
} from './selectors.js';
import {getParser, getTransformer} from './parserSelectors.js';

let requestId = 0;
let clearURLOnClearError = false;

export default (storageAdapter) => (store) => (next) => (action) => {
    switch(action.type) {
    case actions.CLEAR_ERROR:
        if (clearURLOnClearError) {
            globalThis.location.hash = '';
            clearURLOnClearError = false;
        }
        
        return next(action);
    
    case actions.LOAD_SNIPPET: {
        const state = store.getState();
        
        if (isSaving(state) || isForking(state))
            return next(action);
        
        // Cancel previous pending load and goBack behavior
        clearURLOnClearError = false;
        const id = ++requestId;
        
        next(actions.setError(null));
        next(actions.startLoadingSnippet());
        next(action);
        
        loadSnippetFromURL(storageAdapter)
            .then((revision) => {
                if (id !== requestId)
                    return;
                
                if (revision)
                    logEvent('snippet', 'load');
                
                next(revision ? actions.setSnippet(revision) : actions.clearSnippet());
                next(actions.doneLoadingSnippet());
            })
            .catch((error) => {
                if (id !== requestId)
                    return;
                
                const errorMessage = 'Failed to fetch revision: ' + error.message;
                logError(errorMessage);
                
                next(actions.setError(Error(errorMessage)));
                next(actions.doneLoadingSnippet());
                
                if (globalThis.history)
                    clearURLOnClearError = true;
            });
        
        break;
    }
    
    case actions.SAVE: {
        const state = store.getState();
        
        next(action);
        next(actions.startSave(action.fork));
        
        const data = buildSaveData(state);
        saveRevision(action.fork, data, getRevision(state), storageAdapter)
            .then((newRevision) => {
                if (newRevision)
                    storageAdapter.updateHash(newRevision);
            })
            .catch((error) => {
                logError(error.message);
                next(actions.setError(error));
            })
            .then(() => next(actions.endSave(action.fork)));
        
        break;
    }
    
    default:
        return next(action);
    }
};

function buildSaveData(state) {
    const parser         = getParser(state);
    const parserSettings = getParserSettings(state);
    const code           = getCode(state);
    const transformCode  = getTransformCode(state);
    const transformer    = getTransformer(state);
    const showTransformPanel = showTransformer(state);
    
    const data = {
        parserID:  parser.id,
        settings:  { [parser.id]: parserSettings },
        versions:  { [parser.id]: parser.version },
        filename:  `source.${parser.category.fileExtension}`,
        code,
    };
    
    if (showTransformPanel && transformer) {
        data.toolID                   = transformer.id;
        data.versions[transformer.id] = transformer.version;
        data.transform                = transformCode;
    }
    
    return data;
}

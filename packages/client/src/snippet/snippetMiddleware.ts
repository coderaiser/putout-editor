import {createListenerMiddleware} from '@reduxjs/toolkit';
import {tryToCatch} from 'try-to-catch';
import {
    loadSnippetFromURL,
    saveRevision,
} from '../store/operations.ts';
import {logEvent, logError} from '../utils/logger.ts';
import {
    setError,
    clearError,
    startLoadingSnippet,
    doneLoadingSnippet,
    setSnippet,
    clearSnippet,
    startSave,
    endSave,
} from '../store/reducers.ts';
import {
    getParserSettings,
    getCode,
    isSaving,
    isForking,
    getRevision,
    getTransformCode,
    showTransformer,
} from '../store/selectors.ts';
import {getParser, getTransformer} from '../parser-selection/store/parserSelectors.ts';

export function createSnippetListener(storageAdapter: any) {
    const listener = createListenerMiddleware();
    
    let requestId = 0;
    let clearURLOnClearError = false;
    
    // clearError side effect — clears URL hash when error was caused by a bad URL
    listener.startListening({
        actionCreator: clearError,
        effect: () => {
            if (clearURLOnClearError) {
                globalThis.location.hash = '';
                clearURLOnClearError = false;
            }
        },
    });
    
    // load snippet
    listener.startListening({
        type: 'snippet/load',
        effect: async (_, api) => {
            const state = api.getState();
            
            if (isSaving(state) || isForking(state))
                return;
            
            clearURLOnClearError = false;
            const id = ++requestId;
            
            api.dispatch(setError(null));
            api.dispatch(startLoadingSnippet());
            
            const [error, revision] = await tryToCatch(loadSnippetFromURL, storageAdapter);
            
            if (id !== requestId)
                return;
            
            if (error) {
                logError('Failed to fetch revision: ' + error.message);
                api.dispatch(setError(Error('Failed to fetch revision: ' + error.message)));
                api.dispatch(doneLoadingSnippet());
                
                if (globalThis.history)
                    clearURLOnClearError = true;
                
                return;
            }
            
            if (revision)
                logEvent('snippet', 'load');
            
            api.dispatch(revision ? setSnippet(revision) : clearSnippet());
            api.dispatch(doneLoadingSnippet());
        },
    });
    
    // save snippet
    listener.startListening({
        type: 'snippet/save',
        effect: async (action, api) => {
            const fork = action.payload;
            const state = api.getState();
            
            api.dispatch(startSave(fork));
            
            const data = buildSaveData(state);
            const [error, newRevision] = await tryToCatch(
                saveRevision,
                fork,
                data,
                getRevision(state),
                storageAdapter,
            );
            
            if (error) {
                logError(error.message);
                api.dispatch(setError(error));
            } else if (newRevision) {
                storageAdapter.updateHash(newRevision);
            }
            
            api.dispatch(endSave(fork));
        },
    });
    
    return listener;
}

function buildSaveData(state: RootState) {
    const parser = getParser(state);
    const parserSettings = getParserSettings(state);
    const code = getCode(state);
    const transformCode = getTransformCode(state);
    const transformer = getTransformer(state);
    const showTransformPanel = showTransformer(state);
    
    const data: Record<string, any> = {
        parserID: parser.id,
        settings: {
            [parser.id]: parserSettings,
        },
        versions: {
            [parser.id]: parser.version,
        },
        filename: `source.${parser.category.fileExtension}`,
        code,
    };
    
    if (showTransformPanel && transformer) {
        data.toolID = transformer.id;
        data.versions[transformer.id] = transformer.version;
        data.transform = transformCode;
    } else {
        // Signal server to remove transformer file if it was previously set
        data.transform = null;
    }
    
    return data;
}

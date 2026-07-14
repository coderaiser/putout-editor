import {tryCatch} from 'try-catch';

const key = 'explorerSettingsV1';

export function writeState(state, storage = globalThis.localStorage) {
    if (!storage)
        return;
    
    const setItem = storage.setItem.bind(storage);
    const [error] = tryCatch(setItem, key, JSON.stringify(state));
    
    error && console.warn('Unable to write to local storage.');
}

export function readState(storage = globalThis.localStorage) {
    if (!storage)
        return;
    
    const getItem = storage.getItem.bind(storage);
    const [error, state] = tryCatch(getItem, key);
    
    if (error)
        return console.warn('Unable to read from local storage.');
    
    if (state)
        return JSON.parse(state);
}


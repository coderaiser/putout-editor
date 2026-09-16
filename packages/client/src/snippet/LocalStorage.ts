import {tryCatch} from 'try-catch';

const key = 'explorerSettingsV1';

interface LocalStorageLike {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
}

export function writeState(state: unknown, storage?: Partial<LocalStorageLike> | null) {
    const resolved = storage || globalThis.localStorage;
    
    if (!resolved?.setItem)
        return;
    
    const setItem = resolved.setItem.bind(resolved);
    const [error] = tryCatch(setItem, key, JSON.stringify(state));
    
    if (error)
        console.warn('Unable to write to local storage.');
}

export function readState(storage?: Partial<LocalStorageLike> | null) {
    if (storage === null)
        return;
    
    const resolved = storage || globalThis.localStorage;
    
    if (!resolved?.getItem)
        return;
    
    const getItem = resolved.getItem.bind(resolved);
    const [error, state] = tryCatch(getItem, key);
    
    if (error)
        return console.warn('Unable to read from local storage.');
    
    if (state)
        return JSON.parse(state as string);
}

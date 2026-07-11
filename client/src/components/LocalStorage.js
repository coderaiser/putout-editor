import {tryCatch} from 'try-catch';

const storage = globalThis.localStorage;
const key = 'explorerSettingsV1';
const noop = () => {};

export const writeState = !storage ? noop : (state) => {
    const setItem = storage.setItem.bind(storage);
    const [error] = tryCatch(setItem, key, JSON.stringify(state));
    
    error && console.warn('Unable to write to local storage.');
};

export const readState = !storage ? noop : () => {
    const getItem = storage.getItem.bind(storage);
    const [error, state] = tryCatch(getItem, key);
    
    if (error)
        return console.warn('Unable to read from local storage.');
    
    if (state)
        return JSON.parse(state);
};

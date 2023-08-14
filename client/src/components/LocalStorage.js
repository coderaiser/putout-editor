import tryCatch from 'try-catch';

const storage = global.localStorage;
const key = 'explorerSettingsV1';
const noop = () => {};

export const writeState = storage ? (state) => {
    const [error] = tryCatch(storage.setItem.bind(storage), key, JSON.stringify(state));
    
    // eslint-disable-next-line no-console
    error && console.warn('Unable to write to local storage.');
} : noop;

export const readState = storage ? () => {
    try {
        const state = storage.getItem(key);
        
        if (state) {
            return JSON.parse(state);
        }
    } catch {
        // eslint-disable-next-line no-console
        console.warn('Unable to read from local storage.');
    }
} : noop;

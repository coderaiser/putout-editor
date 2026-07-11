import {tryCatch} from 'try-catch';

const {localStorage} = globalThis;
const key = 'explorerSettingsV1';
const noop = () => {};

const maybeFn = (localStorage, fn) => localStorage ? fn : noop;

export const writeState = maybeFn(localStorage, (state) => {
    const setItem = localStorage.setItem.bind(localStorage);
    const [error] = tryCatch(setItem, key, JSON.stringify(state));
    
    error && console.warn('Unable to write to local storage.');
});

export const readState = maybeFn(localStorage, () => {
    const getItem = localStorage.getItem.bind(localStorage);
    const [error, state] = tryCatch(getItem, key);
    
    if (error)
        return console.warn('Unable to read from local storage.');
    
    if (state)
        return JSON.parse(state);
});


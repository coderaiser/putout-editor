import process from 'node:process';

export const {AUTH_TOKEN} = process.env;
export const SETTINGS_FORMAT = 2;
export const MESSAGE = [
    'AUTH_TOKEN is not set! That will result in all gists being anonymous,',
    'which is probably not what you want.',
].join(' ');

export type Log = (message: string) => void;

export function logError(condition: boolean, log: Log) {
    condition && log(MESSAGE);
}

logError(!process.env.AUTH_TOKEN, console.error);

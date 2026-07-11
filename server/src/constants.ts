import process from 'node:process';

if (!process.env.AUTH_TOKEN) {
    console.error(
        'AUTH_TOKEN is not set! That will result in all gists being anonymous, ' +
        'which is probably not what you want.');
}

export const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
export const SETTINGS_FORMAT = 2;

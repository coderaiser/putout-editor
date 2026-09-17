import {http, HttpResponse} from 'msw';
import {apiURL} from '../env.ts';
import {
    makeGistResponse,
    type GistFixture,
} from '../fixtures/gist.ts';

export const gistURL = apiURL('/gist');
export const gistRevisionURL = apiURL('/gist/:id/:revision');
export const gistIDURL = apiURL('/gist/:id');

export function makeGistHandlers(overrides: GistFixture = {}) {
    const body = () => HttpResponse.json(makeGistResponse(overrides));
    
    return [
        http.get(gistRevisionURL, body),
        http.post(gistURL, body),
        http.patch(gistIDURL, body),
        http.post(gistRevisionURL, body),
    ];
}

export const gistHandlers = makeGistHandlers();

export const makeGistHandler = makeGistHandlers;

export function gistErrorHandler(status: number) {
    return [
        http.get(gistRevisionURL, () => new HttpResponse(null, {
            status,
        })),
    ];
}

export const makeGistErrorHandlers = (status: number) => gistErrorHandler(status);

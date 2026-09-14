import {http, HttpResponse} from 'msw';
import {makeGistResponse} from '../fixtures/gist.ts';

export const gistHandlers = [
    http.get('/api/v1/gist/:id/:revision', () =>
        HttpResponse.json(makeGistResponse())),

    http.post('/api/v1/gist', () =>
        HttpResponse.json(makeGistResponse())),

    http.patch('/api/v1/gist/:id', () =>
        HttpResponse.json(makeGistResponse())),

    http.post('/api/v1/gist/:id/:revision', () =>
        HttpResponse.json(makeGistResponse())),
];

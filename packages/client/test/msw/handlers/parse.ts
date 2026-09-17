import {http, HttpResponse} from 'msw';
import {apiURL} from '../env.ts';

export const parseURL = apiURL('/parse/:snippetId/:revisionId');

export function makeParseHandlers() {
    return [
        http.get(parseURL, ({params}) => HttpResponse.json({
            snippetID: params.snippetId,
            revisionID: params.revisionId,
            parserID: 'babel',
        })),
    ];
}

export const parseHandlers = makeParseHandlers();

export function parseErrorHandler(status: number) {
    return [
        http.get(parseURL, () => new HttpResponse(null, {
            status,
        })),
    ];
}

import {http, HttpResponse} from 'msw';

export const parseHandlers = [
    http.get('/api/v1/parse/:snippetId/:revisionId', ({params}) => HttpResponse.json({
        snippetID: params.snippetId,
        revisionID: params.revisionId,
        parserID: 'babel',
    })),
];

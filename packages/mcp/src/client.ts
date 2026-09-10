import {tryCatch} from 'try-catch';
import {tryToCatch} from 'try-to-catch';

export const DEFAULT_BASE_URL = 'http://localhost:8080';

export type ResponseType = 'json' | 'text';

export type RequestOptions = {
    body?: unknown;
    responseType?: ResponseType;
};

export class RequestError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly body: unknown,
    ) {
        super(message);
        this.name = 'RequestError';
    }
}

export async function request(
    path: string,
    options: RequestOptions = {},
): Promise<unknown> {
    const {body, responseType = 'json'} = options;
    const baseUrl = process.env.BASE_URL ?? DEFAULT_BASE_URL;
    const url = `${baseUrl}${path}`;

    const fetchOptions: RequestInit = body
        ? {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        }
        : {method: 'GET'};

    const [networkError, response] = await tryToCatch(fetch, url, fetchOptions);

    if (networkError)
        throw new RequestError(networkError.message, 0, networkError);

    if (!response.ok) {
        // Read body once as text — Response stream is one-shot
        const text = await response.text();
        const [, parsed] = tryCatch(JSON.parse, text);
        throw new RequestError(response.statusText, response.status, parsed ?? text);
    }

    if (responseType === 'text')
        return response.text();

    return response.json();
}

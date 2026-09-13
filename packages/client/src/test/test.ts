import {stub} from 'supertape';

export type MockResponse = {
    ok: boolean;
    status?: number;
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
};

export function mockFetch(response: MockResponse): void {
    (globalThis as {
        fetch: unknown;
    }).fetch = stub().resolves(response);
}

export function mockFetchJson(data: unknown, ok = true): void {
    mockFetch({
        ok,
        status: ok ? 200 : 400,
        json: stub().resolves(data),
    });
}

export function mockFetchText(text: string, ok = true): void {
    mockFetch({
        ok,
        status: ok ? 200 : 400,
        text: stub().resolves(text),
    });
}

export function mockFetchError(status: number): void {
    mockFetch({
        ok: false,
        status,
    });
}

export function restoreFetch(original: typeof fetch): void {
    globalThis.fetch = original;
}

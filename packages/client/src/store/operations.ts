import {estreeToBabel} from 'estree-to-babel';
import type {ParserSettings} from './reducers.ts';
import type {StorageData} from '../snippet/storage/index.ts';
import {
    ignoreKeysFilter,
    locationInformationFilter,
    functionFilter,
    emptyKeysFilter,
    typeKeysFilter,
} from '../parser/TreeAdapter.ts';

/**
 * The storage adapter surface used by the store. Types are intentionally
 * permissive: production passes `StorageHandler` (see `snippet/storage`),
 * tests pass structural doubles implementing a single method.
 */
export type StorageAdapter = {
    fetchFromURL(): unknown;
    create(data: StorageData): unknown;
    update(revision: unknown, data: StorageData): unknown;
    fork(revision: unknown, data: StorageData): unknown;
};

type ParserChild = {
    value: unknown;
    key: string;
    computed: boolean;
};
type ParserWithLoader = {
    nodeToRange: (node: unknown) => unknown;
    forEachProperty: (node: unknown) => Iterable<ParserChild> | void;
    _promise?: Promise<unknown> | null;
    loadParser: (callback: (value: unknown) => void) => void;
    parse: (realParser: unknown, code: string, settings: ParserSettings) => unknown;
    getDefaultOptions: () => ParserSettings;
    opensByDefault?: (node: unknown, key: string) => boolean;
    getNodeName: (node: unknown) => string | null;
    _ignoredProperties: Iterable<unknown>;
    locationProps?: Iterable<string> | null;
    typeProps?: Iterable<string> | null;
};

const returns = <T>(a: T) => () => a;

// Parsers describe these as either `Set` or plain arrays — normalize for the filters.
const toSet = (value: Iterable<unknown> | null | undefined): Set<string> => new Set([...value || []].map(String));

/**
 * Parse code with the given parser and settings.
 * Returns { ast, treeAdapter } on success. Throws on parse error.
 */
export async function parseCode(parser: ParserWithLoader, code: string, parserSettings: ParserSettings) {
    const settings = parserSettings || parser.getDefaultOptions();
    
    if (!parser._promise)
        parser._promise = new Promise((resolve) => parser.loadParser(resolve));
    
    const realParser = await parser._promise;
    const ast = parser.parse(realParser, code, settings);
    
    const treeAdapter = {
        type: 'default',
        options: {
            openByDefault: (parser.opensByDefault || returns(false)).bind(parser),
            nodeToRange: parser.nodeToRange.bind(parser),
            nodeToName: parser.getNodeName.bind(parser),
            walkNode: parser.forEachProperty.bind(parser),
            filters: [
                ignoreKeysFilter(toSet(parser._ignoredProperties)),
                functionFilter(),
                emptyKeysFilter(),
                locationInformationFilter(toSet(parser.locationProps)),
                typeKeysFilter(toSet(parser.typeProps)),
            ],
        },
    };
    
    return {
        ast: estreeToBabel(ast as Parameters<typeof estreeToBabel>[0]),
        treeAdapter,
    };
}

/**
 * Fetch a snippet revision from the URL hash via storageAdapter.
 * Returns revision object or null.
 */
export const loadSnippetFromURL = (storageAdapter: StorageAdapter) => storageAdapter.fetchFromURL!();

/**
 * Save, update, or fork a snippet revision via storageAdapter.
 * fork=true              → storageAdapter.fork(revision, data)
 * fork=false + revision  → storageAdapter.update(revision, data)
 * fork=false + no revision → storageAdapter.create(data)
 * Returns new revision or undefined.
 */
export function saveRevision(fork: boolean, data: StorageData, revision: unknown, storageAdapter: StorageAdapter) {
    if (fork)
        return storageAdapter.fork!(revision, data);
    
    if (revision)
        return storageAdapter.update!(revision, data);
    
    return storageAdapter.create!(data);
}

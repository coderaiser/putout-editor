import {estreeToBabel} from 'estree-to-babel';
import {
    ignoreKeysFilter,
    locationInformationFilter,
    functionFilter,
    emptyKeysFilter,
    typeKeysFilter,
} from '../parser/TreeAdapter.js';

const returns = (a: any) => () => a;

/**
 * Parse code with the given parser and settings.
 * Returns { ast, treeAdapter } on success. Throws on parse error.
 */
export async function parseCode(parser: any, code: string, parserSettings: any) {
    const settings = parserSettings || parser.getDefaultOptions();
    
    if (!parser._promise)
        parser._promise = new Promise(parser.loadParser);
    
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
                ignoreKeysFilter(parser._ignoredProperties),
                functionFilter(),
                emptyKeysFilter(),
                locationInformationFilter(parser.locationProps),
                typeKeysFilter(parser.typeProps),
            ],
        },
    };
    
    return {
        ast: estreeToBabel(ast),
        treeAdapter,
    };
}

/**
 * Fetch a snippet revision from the URL hash via storageAdapter.
 * Returns revision object or null.
 */
export const loadSnippetFromURL = (storageAdapter: any) => storageAdapter.fetchFromURL();

/**
 * Save, update, or fork a snippet revision via storageAdapter.
 * fork=true              → storageAdapter.fork(revision, data)
 * fork=false + revision  → storageAdapter.update(revision, data)
 * fork=false + no revision → storageAdapter.create(data)
 * Returns new revision or undefined.
 */
export function saveRevision(fork: boolean, data: any, revision: any, storageAdapter: any) {
    if (fork)
        return storageAdapter.fork(revision, data);
    
    if (revision)
        return storageAdapter.update(revision, data);
    
    return storageAdapter.create(data);
}

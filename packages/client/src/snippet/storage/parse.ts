import api from './api.ts';
import {
    getTransformerByID,
    getParserByID,
} from '../../parser/parsers/index.ts';
import type {Revision as StoreRevision} from '../../store/reducers.ts';

type URLParameters = {
    id: string;
    rev: string | number;
};

function getIDAndRevisionFromHash(): URLParameters | null {
    const match = globalThis.location.hash.match(/^#\/(?!gist\/)([^/]+)(?:\/(latest|\d*))?/);
    
    if (match)
        return {
            id: match[1],
            rev: match[2] || 0,
        };
    
    return null;
}

async function fetchSnippet(snippetID: string, revisionID: string | number) {
    const response = await api(`/parse/${snippetID}/${revisionID}`);
    
    if (response.ok)
        return new Revision(await response.json());
    
    switch(response.status) {
    case 404:
        throw Error(`Snippet with ID ${snippetID}/${revisionID} doesn't exist.`);
    
    default:
        throw Error('Unknown error.');
    }
}

type RevisionData = {
    snippetID?: string;
    revisionID?: string;
    toolID?: string;
    parserID?: string;
    code?: string;
    transform?: string;
    settings?: Record<string, string> | null;
    [key: string]: unknown;
};

export const owns = (snippet: unknown) => snippet instanceof Revision;

export function matchesURL() {
    return getIDAndRevisionFromHash() !== null;
}

export function updateHash(revision: StoreRevision) {
    const rev = revision.getRevisionID();
    globalThis.location.hash = '/' + revision.getSnippetID() + (rev ? `/${rev}` : '');
}

export async function fetchFromURL() {
    const urlParameters = getIDAndRevisionFromHash();
    
    if (urlParameters)
        return await fetchSnippet(urlParameters.id, urlParameters.rev);
    
    return null;
}

// Note: create/update/fork intentionally absent.
// parse.ts is a read-only backend. StorageHandler routes update/fork
// via _owns() which will never resolve to parse.ts for write operations.
// create() always goes to gist.ts via StorageHandler._first().
export class Revision implements StoreRevision {
    _data: RevisionData;
    constructor(data: RevisionData) {
        this._data = data;
    }
    
    canSave(): boolean {
        return false;
    }
    
    getPath(): string {
        const rev = this.getRevisionID();
        return '/' + this.getSnippetID() + (rev ? `/${rev}` : '');
    }
    
    getSnippetID(): string {
        return this._data.snippetID as string;
    }
    
    getRevisionID(): string {
        return this._data.revisionID as string;
    }
    
    getTransformerID(): string | null {
        return this._data.toolID || null;
    }
    
    getTransformCode(): string {
        const {transform} = this._data;
        
        if (transform)
            return transform;
        
        if (this._data.toolID)
            return getTransformerByID(this._data.toolID)!.defaultTransform as string;
        
        return '';
    }
    
    getParserID(): string {
        const transformerID = this.getTransformerID();
        
        if (transformerID)
            return getTransformerByID(transformerID)!.defaultParserID as string;
        
        return this._data.parserID || '';
    }
    
    getCode(): string {
        const parserID = this.getParserID();
        
        if (this._data.code)
            return this._data.code;
        
        return getParserByID(parserID)!.category!.codeExample;
    }
    
    getParserSettings(): any {
        const {settings} = this._data;
        
        if (!settings)
            return null;
        
        const parserSettings = settings[this.getParserID()];
        
        return parserSettings ? JSON.parse(parserSettings) : null;
    }
    
    getShareData(): {
        versionedURL: string;
        latestURL: string | null;
        embedURL: string | null;
    } {
        const snippetID = this.getSnippetID();
        const revisionID = this.getRevisionID();
        
        return {
            // No double slash — fixed from original
            versionedURL: `https://putout.cloudcmd.io/#/${snippetID}/${revisionID}`,
            latestURL: null,
            embedURL: null,
        };
    }
}

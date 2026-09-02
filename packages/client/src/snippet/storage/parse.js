import api from './api.js';
import {
    getTransformerByID,
    getParserByID,
} from '../../parser/parsers/index.js';

function getIDAndRevisionFromHash() {
    const match = globalThis.location.hash.match(/^#\/(?!gist\/)([^/]+)(?:\/(latest|\d*))?/);
    
    if (match)
        return {
            id: match[1],
            rev: match[2] || 0,
        };
    
    return null;
}

async function fetchSnippet(snippetID, revisionID = 'latest') {
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

export const owns = (snippet) => snippet instanceof Revision;

export function matchesURL() {
    return getIDAndRevisionFromHash() !== null;
}

export function updateHash(revision) {
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
// parse.js is a read-only backend. StorageHandler routes update/fork
// via _owns() which will never resolve to parse.js for write operations.
// create() always goes to gist.js via StorageHandler._first().
export class Revision {
    constructor(data) {
        this._data = data;
    }
    
    canSave() {
        return false;
    }
    
    getPath() {
        const rev = this.getRevisionID();
        return '/' + this.getSnippetID() + (rev ? `/${rev}` : '');
    }
    
    getSnippetID() {
        return this._data.snippetID;
    }
    
    getRevisionID() {
        return this._data.revisionID;
    }
    
    getTransformerID() {
        return this._data.toolID;
    }
    
    getTransformCode() {
        const {transform} = this._data;
        
        if (transform)
            return transform;
        
        if (this._data.toolID)
            return getTransformerByID(this._data.toolID).defaultTransform;
        
        return '';
    }
    
    getParserID() {
        const transformerID = this.getTransformerID();
        
        if (transformerID)
            return getTransformerByID(transformerID).defaultParserID;
        
        return this._data.parserID;
    }
    
    getCode() {
        const parserID = this.getParserID();
        return this._data.code || getParserByID(parserID).category.codeExample;
    }
    
    getParserSettings() {
        const {settings} = this._data;
        
        if (!settings)
            return null;
        
        const parserSettings = settings[this.getParserID()];
        
        return parserSettings && JSON.parse(parserSettings);
    }
    
    getShareData() {
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

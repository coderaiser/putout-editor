import api from './api.js';
import {getParserByID} from '../../parser-selection/parsers/index.js';

function getIDAndRevisionFromHash() {
    const match = globalThis.location.hash.match(/^#\/gist\/([^/]+)(?:\/([^/]+))?/);
    
    if (match)
        return {
            id: match[1],
            rev: match[2],
        };
    
    return null;
}

async function fetchSnippet(snippetID, revisionID = 'latest') {
    const response = await api(`/gist/${snippetID}/${revisionID}`, {
        method: 'GET',
    });
    
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

export async function fetchFromURL() {
    const data = getIDAndRevisionFromHash();
    
    if (!data)
        return null;
    
    return await fetchSnippet(data.id, data.rev);
}

/**
 * Create a new snippet.
 */
export async function create(data) {
    const response = await api('/gist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    
    if (!response.ok)
        throw Error('Unable to create snippet.');
    
    return new Revision(await response.json());
}

/**
 * Update an existing snippet (single PATCH — no prefetch).
 * Caller is responsible for setting data.transform = null when
 * transformer was removed (buildSaveData in snippetMiddleware handles this).
 */
export async function update(revision, data) {
    const response = await api(`/gist/${revision.getSnippetID()}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    
    if (!response.ok)
        throw Error('Unable to update snippet.');
    
    return new Revision(await response.json());
}

/**
 * Fork an existing snippet.
 */
export async function fork(revision, data) {
    const response = await api(`/gist/${revision.getSnippetID()}/${revision.getRevisionID()}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    
    if (!response.ok)
        throw Error('Unable to fork snippet.');
    
    return new Revision(await response.json());
}

export class Revision {
    constructor(gist) {
        this._gist = gist;
        this._config = JSON.parse(gist.files['astexplorer.json'].content);
    }
    
    canSave() {
        return true;
    }
    
    getPath() {
        return `/gist/${this.getSnippetID()}/${this.getRevisionID()}`;
    }
    
    getSnippetID() {
        return this._gist.id;
    }
    
    getRevisionID() {
        return this._gist.history[0].version;
    }
    
    getTransformerID() {
        return this._config.toolID;
    }
    
    getTransformCode() {
        const transformFile = this._gist.files['transform.js'];
        return transformFile ? transformFile.content : '';
    }
    
    getParserID() {
        return this._config.parserID;
    }
    
    getCode() {
        if (this._code == null)
            this._code = getSource(this._config, this._gist) || '';
        
        return this._code;
    }
    
    getParserSettings() {
        return this._config.settings[this._config.parserID];
    }
    
    getShareData() {
        const snippetID = this.getSnippetID();
        const revisionID = this.getRevisionID();
        
        return {
            versionedURL: `https://putout.cloudcmd.io/#/gist/${snippetID}/${revisionID}`,
            latestURL: `https://putout.cloudcmd.io/#/gist/${snippetID}/latest`,
            embedURL: `<script src="https://putout.cloudcmd.io/#gist/${snippetID}/${revisionID}.js"></script>`,
        };
    }
}

function getSource(config, gist) {
    if (config.v === 1)
        return gist.files['code.js'].content;
    
    if (config.v === 2) {
        const ext = getParserByID(config.parserID).category.fileExtension;
        return gist.files[`source.${ext}`].content;
    }
}

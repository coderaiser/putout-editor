import type {Revision as StoreRevision} from '../../store/reducers.ts';

/** Minimal revision shape needed to build a URL hash — `parse`/`gist` both satisfy it. */
export type RevisionLike = {
    getPath(): string;
};

export type StorageData = {
    parserID?: string;
    code?: string;
    transformCode?: string;
    [key: string]: unknown;
};

/** Revision shape used by write operations — both backends only read IDs/path. */
export type StorageRevision = {
    getPath?(): string;
    getSnippetID?(): string;
    getRevisionID?(): string;
    [key: string]: unknown;
};

const isObject = (a: unknown): a is object => Boolean(a) && typeof a === 'object';

type StorageBackend = {
    owns?: (revision: unknown) => boolean;
    matchesURL?: () => boolean;
    fetchFromURL?: () => Promise<unknown>;
    create?: (data: StorageData) => Promise<unknown>;
    update?: (revision: StorageRevision, data: StorageData) => Promise<unknown>;
    fork?: (revision: StorageRevision, data: StorageData) => Promise<unknown>;
};

export default class StorageHandler {
    _backends: StorageBackend[];
    constructor(backends: StorageBackend[]) {
        this._backends = backends;
    }
    
    _first(): StorageBackend {
        return this._backends[0];
    }
    
    _owns(revision: unknown): StorageBackend | null {
        for (const backend of this._backends) {
            if (backend.owns?.(revision))
                return backend;
        }
        
        return null;
    }
    
    updateHash(revision: RevisionLike) {
        globalThis.location.hash = revision.getPath();
    }
    
    fetchFromURL() {
        if (/^#?\/?$/.test(globalThis.location.hash))
            return Promise.resolve(null);
        
        for (const backend of this._backends) {
            if (backend.matchesURL?.())
                return backend.fetchFromURL!();
        }
        
        return Promise.reject(Error('Unknown URL format.'));
    }
    /**
   * Create a new snippet.
   */
    create(data: StorageData) {
        return this._first().create!(data);
    }
    /**
   * Update an existing snippet.
   */
    update(revision: StorageRevision, data: StorageData) {
        return this._owns(revision)!.update!(revision, data);
    }
    /**
   * Fork existing snippet.
   */
    fork(revision: StorageRevision, data: StorageData) {
        return this._owns(revision)!.fork!(revision, data);
    }
}

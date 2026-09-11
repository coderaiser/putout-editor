type StorageBackend = {
    owns?: (revision: any) => boolean;
    matchesURL?: () => boolean;
    fetchFromURL?: () => Promise<unknown>;
    create?: (data: any) => Promise<any>;
    update?: (revision: any, data: any) => Promise<any>;
    fork?: (revision: any, data: any) => Promise<any>;
};

export default class StorageHandler {
    _backends: StorageBackend[];
    
    constructor(backends: StorageBackend[]) {
        this._backends = backends;
    }
    
    _first(): StorageBackend {
        return this._backends[0];
    }
    
    _owns(revision: any): StorageBackend | null {
        for (const backend of this._backends) {
            if (backend.owns?.(revision))
                return backend;
        }
        
        return null;
    }
    
    updateHash(revision: any) {
        globalThis.location.hash = revision.getPath();
    }
    
    fetchFromURL() {
        if (/^#?\/?$/.test(globalThis.location.hash))
            return Promise.resolve(null);
        
        for (const backend of this._backends) {
            if (backend.matchesURL?.()) {
                const result = backend.fetchFromURL!();
                return result;
            }
        }
        
        return Promise.reject(Error('Unknown URL format.'));
    }
    /**
   * Create a new snippet.
   */
    create(data: any) {
        return this
            ._first()
            .create!(data);
    }
    /**
   * Update an existing snippet.
   */
    update(revision: any, data: any) {
        return this
            ._owns(revision)!
            .update!(revision, data);
    }
    /**
   * Fork existing snippet.
   */
    fork(revision: any, data: any) {
        return this
            ._owns(revision)!
            .fork!(revision, data);
    }
}

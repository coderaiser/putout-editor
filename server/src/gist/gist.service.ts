import {Injectable} from '@nestjs/common';
import {GithubService} from './github.service.ts';
import type {
    GistBody,
    CreateGistFiles,
    UpdateGistFiles,
    CreateGistPayload,
    UpdateGistPayload,
} from './gist.types.ts';
import {SETTINGS_FORMAT} from '../constants.ts';

function makeCreateFiles(entries: [string, string][]): CreateGistFiles {
    const files: CreateGistFiles = {};
    
    for (const [filename, content] of entries)
        files[filename] = {
            content,
        };
    
    return files;
}

function makeUpdateFiles(entries: [string, string | null][]): UpdateGistFiles {
    const files: UpdateGistFiles = {};
    
    for (const [filename, content] of entries) {
        if (content === null)
            continue;
        
        files[filename] = {
            content,
        };
    }
    
    return files;
}

function toCreateGistPayload(body: GistBody): CreateGistPayload {
    const entries: [string, string][] = [
        ['astexplorer.json', JSON.stringify({
            v: SETTINGS_FORMAT,
            parserID: body.parserID,
            toolID: body.toolID,
            settings: body.settings,
            versions: body.versions,
        }, null, 2)],
        [body.filename, body.code],
    ];
    
    if (body.transform && body.transform !== null)
        entries.push(['transform.js', body.transform]);
    
    return {
        files: makeCreateFiles(entries),
        description: body.description,
        public: Boolean(body.public),
    };
}

function toUpdateGistPayload(body: GistBody): UpdateGistPayload {
    const entries: [string, string | null][] = [
        ['astexplorer.json', JSON.stringify({
            v: SETTINGS_FORMAT,
            parserID: body.parserID,
            toolID: body.toolID,
            settings: body.settings,
            versions: body.versions,
        }, null, 2)],
        [body.filename, body.code],
    ];
    
    if (body.transform || body.transform === null)
        entries.push(['transform.js', body.transform]);
    
    return {
        files: makeUpdateFiles(entries),
        description: body.description,
    };
}

@Injectable()
export class GistService {
    constructor(private readonly githubService: GithubService) {}
    
    async load(gistId: string, revisionId?: string) {
        return this.githubService.load(gistId, revisionId);
    }
    
    async create(body: GistBody) {
        return this.githubService.create(toCreateGistPayload(body));
    }
    
    async update(gistId: string, body: GistBody) {
        return this.githubService.update(gistId, toUpdateGistPayload(body));
    }
    
    async fork(body: GistBody) {
        // We cannot really "fork" an "anonymous" gist because a user
        // (the app's own token) cannot fork its own gist, so a fork is
        // implemented as creating a fresh gist with the same content.
        return this.githubService.create(toCreateGistPayload(body));
    }
}

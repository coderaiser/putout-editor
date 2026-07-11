import {Injectable} from '@nestjs/common';
import {GithubService} from './github.service.ts';
import type {
    GistBody,
    GistFiles,
    GistPayload,
} from './gist.types.ts';
import {SETTINGS_FORMAT} from '../constants.ts';

function makeFiles(entries: [
    string,
    string,
][]): GistFiles {
    return entries.reduce((files: GistFiles, [filename, content]) => {
        files[filename] = {
            content,
        };
        
        return files;
    }, {});
}

function toGistPayload(body: GistBody): GistPayload {
    const entries: [
        string,
        string,
    ][] = [
        ['astexplorer.json', JSON.stringify({
            v: SETTINGS_FORMAT,
            parserID: body.parserID,
            toolID: body.toolID,
            settings: body.settings,
            versions: body.versions,
        }, null, 2)],
        [body.filename, body.code],
    ];
    
    if ( // GitHub's Gist API deletes a file by sending empty content for its
    // name, not by sending a null value -- a null file value is rejected
    // by the API outright (see octokit/rest.js#19).
        body.transform || body.transform === null)
        entries.push(['transform.js', body.transform || '']);
    
    return {
        files: makeFiles(entries),
        description: body.description,
        public: Boolean(body.public),
    };
}

@Injectable()
export class GistService {
    constructor(private readonly githubService: GithubService) {}
    
    async load(gistId: string, revisionId?: string) {
        return this.githubService.load(gistId, revisionId);
    }
    
    async create(body: GistBody) {
        return this.githubService.create(toGistPayload(body));
    }
    
    async update(gistId: string, body: GistBody) {
        return this.githubService.update(gistId, toGistPayload(body));
    }
    
    async fork(body: GistBody) {
        // We cannot really "fork" an "anonymous" gist because a user
        // (the app's own token) cannot fork its own gist, so a fork is
        // implemented as creating a fresh gist with the same content.
        return this.githubService.create(toGistPayload(body));
    }
}

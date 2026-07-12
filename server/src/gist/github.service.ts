import {Inject, Injectable} from '@nestjs/common';
import {Octokit} from '@octokit/rest';
import type {
    CreateGistPayload,
    UpdateGistPayload,
} from './gist.types.ts';

@Injectable()
export class GithubService {
    constructor(
        @Inject('OCTOKIT') private readonly octokit: Octokit,
    ) {}
    
    async load(gistId: string, revisionId?: string) {
        const latest = !revisionId || revisionId === 'latest';
        
        const response = await this.octokit.rest.gists.get({
            gist_id: gistId,
            ...!latest && {
                sha: revisionId,
            },
        });
        
        return response.data;
    }
    
    async create(data: CreateGistPayload) {
        const response = await this.octokit.rest.gists.create(data);
        
        return response.data;
    }
    
    async update(gistId: string, data: UpdateGistPayload) {
        const response = await this.octokit.rest.gists.update({
            gist_id: gistId,
            ...data,
        });
        
        return response.data;
    }
}

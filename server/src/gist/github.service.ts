import {Inject, Injectable} from '@nestjs/common';

@Injectable()
export class GithubService {
    constructor(@Inject('OCTOKIT') private readonly octokit: any) {}
    
    async load(gistId: string, revisionId?: string) {
        const response = await this.octokit.rest.gists.get({
            gist_id: gistId,
            ...(revisionId && {sha: revisionId}),
        });
        
        return response.data;
    }
    
    async create(data: any) {
        const response = await this.octokit.rest.gists.create(data);
        
        return response.data;
    }
    
    async update(gistId: string, data: any) {
        const response = await this.octokit.rest.gists.update({
            gist_id: gistId,
            ...data,
        });
        
        return response.data;
    }
}

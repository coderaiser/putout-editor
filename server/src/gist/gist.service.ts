import {Injectable} from '@nestjs/common';
import {GithubService} from './github.service.ts';

@Injectable()
export class GistService {
    constructor(private readonly githubService: GithubService) {}
    
    async load(gistId: string, revisionId?: string) {
        return this.githubService.load(gistId, revisionId);
    }
    
    async create(data: any) {
        return this.githubService.create(data);
    }
    
    async update(gistId: string, data: any) {
        return this.githubService.update(gistId, data);
    }
    
    async fork(data: any) {
        return this.githubService.create(data);
    }
}

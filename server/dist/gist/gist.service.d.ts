import { GithubService } from './github.service.js';
export declare class GistService {
    private readonly githubService;
    constructor(githubService: GithubService);
    load(gistId: string, revisionId?: string): Promise<any>;
    create(data: any): Promise<any>;
    update(gistId: string, data: any): Promise<any>;
    fork(data: any): Promise<any>;
}

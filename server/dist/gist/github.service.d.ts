export declare class GithubService {
    private readonly octokit;
    constructor(octokit: any);
    load(gistId: string, revisionId?: string): Promise<any>;
    create(data: any): Promise<any>;
    update(gistId: string, data: any): Promise<any>;
}

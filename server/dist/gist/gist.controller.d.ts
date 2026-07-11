import { GistService } from './gist.service.js';
export declare class GistController {
    private readonly gistService;
    constructor(gistService: GistService);
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    fork(id: string, revision: string, body: any): Promise<any>;
    load(id: string, revision: string): Promise<any>;
}

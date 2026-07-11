import { ParseService } from './parse.service.js';
export declare class ParseController {
    private readonly parseService;
    constructor(parseService: ParseService);
    load(snippetId: string, revisionId: string): Promise<any>;
}

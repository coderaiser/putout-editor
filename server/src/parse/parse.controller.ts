import {Controller, Get, Param} from '@nestjs/common';
import {ParseService} from './parse.service.js';

@Controller('api/v1/parse')
export class ParseController {
    constructor(private readonly parseService: ParseService) {}
    
    @Get(':snippetid/:revisionid')
    load(@Param('snippetid') snippetId: string, @Param('revisionid') revisionId: string) {
        return this.parseService.load(snippetId, revisionId);
    }
}

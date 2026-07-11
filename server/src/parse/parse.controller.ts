import {
    Controller,
    Get,
    Param,
} from '@nestjs/common';
import {ParseService} from './parse.service.ts';

export @Controller('api/v1/parse')
class ParseController {
    constructor(private readonly parseService: ParseService) {}
    
    load(@Param('snippetid') snippetId: string, @Param('revisionid') revisionId: string) {
        return this.parseService.load(snippetId, revisionId);
    }
}

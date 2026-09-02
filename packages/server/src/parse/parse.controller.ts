import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Put,
    Query,
} from '@nestjs/common';
import {ParseService} from './parse.service.ts';
import type {ParseRequest} from './parse.types.ts';

@Controller('api/v1/parse')
export class ParseController {
    constructor(private readonly parseService: ParseService) {}
    
    @Get(':snippetid/:revisionid')
    load(
        @Param('snippetid') snippetId: string,
        @Param('revisionid') revisionId: string,
    ) {
        return this.parseService.load(snippetId, revisionId);
    }
    
    @Get()
    getDocumentation() {
        return this.parseService.documentation();
    }
    
    @Put()
    @HttpCode(200)
    async parseSource(
        @Body() body: ParseRequest,
        @Query('compact') compact?: string,
        @Query('query') query?: string,
    ) {
        return this.parseService.parseSource(body.source, {
            compact: compact === 'true',
            query,
        });
    }
}

import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import {GistService} from './gist.service.ts';
import type {GistBody} from './gist.types.ts';

@Controller('api/v1/gist')
export class GistController {
    constructor(private readonly gistService: GistService) {}
    
    @Post()
    create(@Body() body: GistBody) {
        return this.gistService.create(body);
    }
    
    @Patch(':id')
    update(@Param('id') id: string, @Body() body: GistBody) {
        return this.gistService.update(id, body);
    }
    
    @Post(':id/:revision')
    fork(@Param('id') id: string, @Param('revision') revision: string, @Body() body: GistBody) {
        return this.gistService.fork(body);
    }
    
    @Get(':id/:revision')
    load(@Param('id') id: string, @Param('revision') revision: string) {
        return this.gistService.load(id, revision);
    }
}

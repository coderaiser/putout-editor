import {
    Body,
    Controller,
    Get,
    HttpCode,
    Put,
} from '@nestjs/common';
import {FindPlacesService} from './find-places.service.ts';
import type {TransformRequest} from './transform.types.ts';

@Controller('api/v1/find-places')
export class FindPlacesController {
    constructor(private readonly findPlacesService: FindPlacesService) {}
    
    @Get()
    getDocumentation() {
        return this.findPlacesService.documentation();
    }
    
    @Put()
    @HttpCode(200)
    findPlaces(
        @Body() body: TransformRequest,
    ) {
        return this.findPlacesService.findPlaces(body);
    }
}

import {
    Body,
    Controller,
    Get,
    HttpCode,
    Put,
} from '@nestjs/common';
import {TransformService} from './transform.service.ts';
import type {TransformRequest} from './transform.types.ts';

@Controller('api/v1/transform')
export class TransformController {
    constructor(private readonly transformService: TransformService) {}
    
    @Get()
    getDocumentation() {
        return this.transformService.documentation();
    }
    
    @Put()
    @HttpCode(200)
    async transform(
        @Body() body: TransformRequest,
    ) {
        return this.transformService.transform(body);
    }
}

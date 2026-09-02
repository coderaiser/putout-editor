import {Controller, Get} from '@nestjs/common';
import {InfoService} from './info.service.ts';

@Controller('api/v1/info')
export class InfoController {
    constructor(private readonly infoService: InfoService) {}
    
    @Get()
    getInfo() {
        return this.infoService.info();
    }
}

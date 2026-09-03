import {Controller, Get, Header, Res} from '@nestjs/common';
import type {Response} from 'express';
import {LlmsService} from './llms.service.ts';

@Controller()
export class LlmsController {
    constructor(private readonly llmsService: LlmsService) {}

    @Get('llms.txt')
    @Header('Content-Type', 'text/plain; charset=utf-8')
    getLlmsTxt(@Res() response: Response) {
        response.send(this.llmsService.llmsTxt());
    }

    @Get('llms-full.txt')
    @Header('Content-Type', 'text/plain; charset=utf-8')
    getLlmsFullTxt(@Res() response: Response) {
        response.send(this.llmsService.llmsFullTxt());
    }
}
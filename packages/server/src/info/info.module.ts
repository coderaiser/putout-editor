import {Module} from '@nestjs/common';
import {InfoController} from './info.controller.ts';
import {InfoService} from './info.service.ts';
import {ParseService} from '../parse/parse.service.ts';

@Module({
    controllers: [InfoController],
    providers: [
        InfoService,
        ParseService, {
            provide: 'SNIPPETS',
            useValue: new Map(),
        }, {
            provide: 'SNIPPET_REVISIONS',
            useValue: new Map(),
        },
    ],
})
export class InfoModule {}

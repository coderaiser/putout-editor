import {Module} from '@nestjs/common';
import {ParseController} from './parse.controller.js';
import {ParseService} from './parse.service.js';

@Module({
    controllers: [ParseController],
    providers: [
        ParseService,
        {
            provide: 'SNIPPETS',
            useValue: new Map(),
        },
        {
            provide: 'SNIPPET_REVISIONS',
            useValue: new Map(),
        },
    ],
    exports: [],
})
export class ParseModule {}

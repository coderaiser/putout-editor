import {Module} from '@nestjs/common';
import {ParseController} from './parse.controller.ts';
import {ParseService} from './parse.service.ts';

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

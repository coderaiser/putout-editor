import {Module} from '@nestjs/common';
import {InfoController} from './info.controller.ts';
import {InfoService} from './info.service.ts';
import {TransformService} from '../transform/transform.service.ts';
import {FindPlacesService} from '../transform/find-places.service.ts';
import {ParseService} from '../parse/parse.service.ts';

@Module({
    controllers: [InfoController],
    providers: [
        InfoService,
        TransformService,
        FindPlacesService,
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

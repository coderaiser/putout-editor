import {Module} from '@nestjs/common';
import {TransformController} from './transform.controller.ts';
import {TransformService} from './transform.service.ts';
import {FindPlacesController} from './find-places.controller.ts';
import {FindPlacesService} from './find-places.service.ts';

@Module({
    controllers: [TransformController, FindPlacesController],
    providers: [TransformService, FindPlacesService],
})
export class TransformModule {}
